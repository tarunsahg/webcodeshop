import 'server-only';
import { NextResponse } from 'next/server';

export function ok(data, init) {
  return NextResponse.json(data, init);
}
export function fail(status, message, extra) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status });
}
export async function handle(fn) {
  try {
    return await fn();
  } catch (err) {
    const status = err && err.status ? err.status : 500;
    const msg = err && err.message ? err.message : 'Server error';
    if (status >= 500) console.error('[API]', err);
    return fail(status, msg);
  }
}
export async function parseJSON(req) {
  try { return await req.json(); } catch { return {}; }
}
