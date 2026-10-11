import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isGoogleConfigured, getAuthUrl, makeState } from '@/lib/oauth-google';

export async function GET(req) {
  if (!isGoogleConfigured()) {
    return NextResponse.json({
      error: 'Google OAuth is not configured.',
      hint: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and (optionally) GOOGLE_REDIRECT_URI in your .env. See README.md for instructions.',
    }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const next = searchParams.get('next') || '/account';
  const state = makeState();
  cookies().set('wcs_oauth_state', state, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600,
    secure: process.env.NODE_ENV === 'production',
  });
  return NextResponse.redirect(getAuthUrl(state, next));
}
