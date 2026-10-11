import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';
import { verifyDownload, MAX_DOWNLOADS_PER_KEY } from '@/lib/download-token';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const jsonErr = (msg, status) => NextResponse.json({ error: msg }, { status });

const MIME = {
  zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar', gz: 'application/gzip', tgz: 'application/gzip',
  pdf: 'application/pdf', txt: 'text/plain', json: 'application/json',
  js: 'text/javascript', html: 'text/html', css: 'text/css', sql: 'application/sql',
  apk: 'application/vnd.android.package-archive', exe: 'application/octet-stream',
};

// Serve a purchased file ONLY via a valid, unexpired signed token that matches
// the signed-in owner. Every download is counted. Gift cards are never served here.
export async function GET(req) {
  const token = new URL(req.url).searchParams.get('t');
  const payload = verifyDownload(token);
  if (!payload) return jsonErr('This download link is invalid or has expired. Open your account and download again.', 410);

  const me = getSessionUser();
  if (!me) return jsonErr('Sign in to download this file.', 401);

  const key = db()
    .prepare('SELECT lk.*, o.user_id, o.customer_email, p.name as product_name, p.file_url, p.file_name, p.kind as product_kind FROM license_keys lk LEFT JOIN orders o ON o.id=lk.order_id LEFT JOIN products p ON p.id=lk.product_id WHERE lk.code=?')
    .get(payload.code);
  if (!key) return jsonErr('Invalid license key.', 404);
  if (key.kind === 'giftcard' || key.product_kind === 'giftcard') return jsonErr('Gift cards are redeemable codes and do not have a file download.', 400);

  const owns = me.role === 'admin' || me.id === key.user_id || (me.email && me.email === key.customer_email);
  // The token must belong to the user who is signed in.
  const tokenMatchesUser = me.role === 'admin' || !payload.uid || payload.uid === me.id;
  if (!owns || !tokenMatchesUser) return jsonErr('This link is not valid for your account.', 403);

  // Enforce + record the per-user download count.
  const used = db().prepare('SELECT COUNT(*) as c FROM downloads WHERE license_code=? AND user_id=?').get(payload.code, me.id).c;
  if (me.role !== 'admin' && used >= MAX_DOWNLOADS_PER_KEY) {
    return jsonErr('Download limit reached for this product.', 429);
  }

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  try {
    db().prepare('INSERT INTO downloads (license_code, user_id, email, ip, user_agent) VALUES (?,?,?,?,?)').run(payload.code, me.id, me.email, ip, ua);
  } catch (e) {}

  const fileUrl = key.file_url || '';
  const baseName = (key.product_name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product';

  // 1) Locally uploaded product file -> stream it from secure storage.
  if (fileUrl.startsWith('/uploads/')) {
    try {
      const abs = path.join(process.cwd(), 'public', fileUrl.replace(/^[/]+/, ''));
      const root = path.join(process.cwd(), 'public', 'uploads');
      if (abs.startsWith(root) && fs.existsSync(abs)) {
        const buf = fs.readFileSync(abs);
        const ext = (fileUrl.split('.').pop() || 'bin').toLowerCase();
        const filename = baseName + '.' + ext;
        return new NextResponse(buf, {
          status: 200,
          headers: {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Content-Disposition': 'attachment; filename="' + filename + '"',
            'Cache-Control': 'no-store',
          },
        });
      }
    } catch (e) {}
  }

  // 2) External direct link -> redirect (the SIGNED link still expires in 60 minutes).
  if (/^https?:[/]{2}/i.test(fileUrl)) {
    return NextResponse.redirect(fileUrl, 302);
  }

  // 3) Fallback: watermarked placeholder when no real file is attached yet.
  const downloadNo = used + 1;
  const buyer = me.email || key.customer_email || 'licensed user';
  const filename = baseName + '-' + key.code + '.txt';
  const body = [
    'WebCodeShop - Secure digital download',
    '=====================================',
    'Product:      ' + key.product_name,
    'License key:  ' + key.code,
    'Order:        ' + key.order_id,
    'Licensed to:  ' + buyer,
    'Download #:   ' + downloadNo + ' of ' + MAX_DOWNLOADS_PER_KEY,
    'Issued:       ' + new Date().toISOString(),
    '',
    'No file has been attached to this product yet.',
    'Admin: add one in Admin > Products > Downloadable file.',
    'This placeholder is licensed to ' + buyer + '. Redistribution or resale is prohibited.',
  ].join('\n');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
      'Cache-Control': 'no-store',
    },
  });
}
