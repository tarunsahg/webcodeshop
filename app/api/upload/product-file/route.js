import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Product (code/script) files. Broad whitelist by extension since code archives
// often arrive with generic MIME types. Gift cards never use this.
const ALLOWED_EXT = new Set([
  'zip', 'rar', '7z', 'tar', 'gz', 'tgz',
  'pdf', 'txt', 'md', 'rtf', 'csv',
  'php', 'html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'yml', 'yaml',
  'sql', 'sh', 'py', 'rb', 'java', 'go', 'c', 'cpp', 'h', 'cs', 'env',
  'apk', 'exe', 'msi', 'dmg', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
]);
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

// POST  multipart/form-data  field: "file"  ->  { url: "/uploads/files/name-xxxx.zip", name: "original.zip" }
export async function POST(req) {
  return handle(async () => {
    requireAdmin();
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') throw httpError(400, 'No file provided');

    const orig = (typeof file.name === 'string' && file.name) ? file.name : 'file';
    const dot = orig.lastIndexOf('.');
    const ext = (dot >= 0 ? orig.slice(dot + 1) : '').toLowerCase();
    if (!ext || !ALLOWED_EXT.has(ext)) throw httpError(400, 'Unsupported file type: .' + (ext || '?'));
    if (file.size > MAX_BYTES) throw httpError(400, 'File too large (max 100 MB)');

    // The stored link is derived from the original file name (plus a short hash to stay unique).
    const base = (dot >= 0 ? orig.slice(0, dot) : orig)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file';

    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), 'public', 'uploads', 'files');
    fs.mkdirSync(dir, { recursive: true });
    const fname = base + '-' + crypto.randomBytes(4).toString('hex') + '.' + ext;
    fs.writeFileSync(path.join(dir, fname), buf);

    return ok({ url: '/uploads/files/' + fname, name: orig });
  });
}
