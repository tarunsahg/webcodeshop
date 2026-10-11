import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-server';
import { ok, fail, handle, parseJSON } from '@/lib/api-utils';
import { signDownload, DOWNLOAD_TTL_MS, MAX_DOWNLOADS_PER_KEY } from '@/lib/download-token';

// Mint a short-lived, signed download URL. Raw download links are never exposed;
// the client must request a fresh signed link each time it wants to download.
export async function POST(req) {
  return handle(async () => {
    const me = requireUser();
    const { code } = await parseJSON(req);
    if (!code) return fail(400, 'Missing license code');

    const key = db()
      .prepare('SELECT lk.*, o.user_id, o.customer_email FROM license_keys lk LEFT JOIN orders o ON o.id=lk.order_id WHERE lk.code=?')
      .get(code);
    if (!key) return fail(404, 'Invalid license key');
    if (key.kind === 'giftcard') return fail(400, 'Gift cards are redeemable codes and do not have a file download.');

    const owns = me.role === 'admin' || me.id === key.user_id || (me.email && me.email === key.customer_email);
    if (!owns) return fail(403, 'You do not own this product');

    // Enforce per-user download cap (admins are exempt).
    const used = db().prepare('SELECT COUNT(*) as c FROM downloads WHERE license_code=? AND user_id=?').get(code, me.id).c;
    if (me.role !== 'admin' && used >= MAX_DOWNLOADS_PER_KEY) {
      return fail(429, 'Download limit reached for this product. Please contact support if you need more.');
    }

    const token = signDownload({ code, userId: me.id, email: me.email });
    const remaining = me.role === 'admin' ? null : Math.max(0, MAX_DOWNLOADS_PER_KEY - used);
    return ok({
      url: '/api/download/file?t=' + encodeURIComponent(token),
      expiresInSec: Math.floor(DOWNLOAD_TTL_MS / 1000),
      remaining,
      max: MAX_DOWNLOADS_PER_KEY,
    });
  });
}
