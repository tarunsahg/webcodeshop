import 'server-only';
import crypto from 'crypto';

const SECRET = process.env.WCS_SECRET || 'webcodeshop-dev-secret-change-me-in-production';

// How long a signed download link stays valid (60 minutes).
export const DOWNLOAD_TTL_MS = 60 * 60 * 1000;
// Maximum downloads allowed per license key, per user.
export const MAX_DOWNLOADS_PER_KEY = 10;

// Create a tamper-proof, time-limited token for a single license code + user.
export function signDownload({ code, userId, email }) {
  const payload = {
    code,
    uid: userId || null,
    em: email || null,
    exp: Date.now() + DOWNLOAD_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return data + '.' + sig;
}

export function verifyDownload(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  let a, b;
  try { a = Buffer.from(sig); b = Buffer.from(expected); } catch { return null; }
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
