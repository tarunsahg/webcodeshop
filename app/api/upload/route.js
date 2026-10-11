import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

const ALLOWED = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIM = 6000; // max width/height in px (defense-in-depth; editor auto-resizes)

// Reads pixel dimensions from common raster formats (png/gif/jpeg). Returns null if unknown.
function imageSize(buf) {
  try {
    if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
    if (buf.length >= 10 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
      return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
    }
    if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let o = 2;
      const len = buf.length;
      while (o < len) {
        if (buf[o] !== 0xff) { o++; continue; }
        let marker = buf[o + 1];
        while (marker === 0xff && o + 1 < len) { o++; marker = buf[o + 1]; }
        o += 2;
        if (marker >= 0xd0 && marker <= 0xd9) continue;
        if (marker === 0x01) continue;
        if (o + 7 >= len) break;
        const segLen = buf.readUInt16BE(o);
        const isSOF = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
        if (isSOF) { return { h: buf.readUInt16BE(o + 3), w: buf.readUInt16BE(o + 5) }; }
        o += segLen;
      }
    }
  } catch (e) { return null; }
  return null;
}

// POST  multipart/form-data  field: "file"  ->  { url: "/uploads/xxx.png" }
export async function POST(req) {
  return handle(async () => {
    requireAdmin();
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') throw httpError(400, 'No file provided');
    const ext = ALLOWED[file.type];
    if (!ext) throw httpError(400, 'Unsupported file type. Use PNG, JPG, WEBP, GIF or SVG.');
    if (file.size > MAX_BYTES) throw httpError(400, 'File too large (max 5 MB)');

    const buf = Buffer.from(await file.arrayBuffer());
    const dim = imageSize(buf);
    if (dim && (dim.w > MAX_DIM || dim.h > MAX_DIM)) throw httpError(400, 'Image dimensions are too large (max ' + MAX_DIM + '×' + MAX_DIM + 'px). Please add it through the product or category editor, which auto-resizes images.');
    const dir = path.join(process.cwd(), 'public', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    const fname = 'p_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex') + '.' + ext;
    fs.writeFileSync(path.join(dir, fname), buf);

    return ok({ url: '/uploads/' + fname });
  });
}
