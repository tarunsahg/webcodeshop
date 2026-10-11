import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db.js';

const SECRET = process.env.WCS_SECRET || 'webcodeshop-dev-secret-change-me-in-production';
const COOKIE = 'wcs_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function signToken(payload) {
  const body = { ...payload, exp: Date.now() + MAX_AGE * 1000 };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return data + '.' + sig;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Set the session cookie on the outgoing NextResponse. Setting cookies on the
// response object works reliably in route handlers (including Turbopack dev),
// unlike cookies().set() from next/headers which can be unavailable in some
// runtime contexts.
export function setSessionCookie(res, token) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export function clearSessionCookie(res) {
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}

export function getSessionUser() {
  const c = cookies().get(COOKIE);
  if (!c) return null;
  const payload = verifyToken(c.value);
  if (!payload) return null;
  const row = db().prepare('SELECT id,name,email,role,avatar,created_at FROM users WHERE id=?').get(payload.userId);
  return row || null;
}

export function requireUser() {
  const u = getSessionUser();
  if (!u) throw httpError(401, 'Not authenticated');
  return u;
}

export function requireAdmin() {
  const u = requireUser();
  if (u.role !== 'admin') throw httpError(403, 'Admin only');
  return u;
}

export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
