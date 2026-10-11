import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setSessionCookie } from '@/lib/auth-server';
import { isGoogleConfigured, exchangeCode, fetchProfile, findOrCreateOAuthUser, loginOAuthUser } from '@/lib/oauth-google';
import { sendWelcome } from '@/lib/mailer';
import { db } from '@/lib/db';

function errorRedirect(msg, base) {
  const u = new URL('/login', base);
  u.searchParams.set('error', msg);
  return NextResponse.redirect(u);
}

export async function GET(req) {
  const base = new URL(req.url).origin;
  if (!isGoogleConfigured()) return errorRedirect('Google sign-in is not configured', base);

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state') || '';
  const err = searchParams.get('error');
  if (err) return errorRedirect('Google sign-in canceled', base);
  if (!code) return errorRedirect('Missing authorization code', base);

  const [stateNonce, nextEnc] = stateParam.split(':');
  const next = nextEnc ? decodeURIComponent(nextEnc) : '/account';

  const cookieState = cookies().get('wcs_oauth_state');
  cookies().set('wcs_oauth_state', '', { path: '/', maxAge: 0 });
  if (!cookieState || cookieState.value !== stateNonce) return errorRedirect('Invalid OAuth state', base);

  try {
    const tokens = await exchangeCode(code);
    const profile = await fetchProfile(tokens.access_token);
    if (!profile.email) return errorRedirect('Google did not return an email', base);

    // Detect whether this is a new local user (we'll send a welcome email).
    const preexisting = db().prepare('SELECT id FROM users WHERE email=?').get(String(profile.email).toLowerCase().trim());
    const user = findOrCreateOAuthUser(profile);
    const token = loginOAuthUser(user);

    if (!preexisting) {
      sendWelcome({ name: user.name, email: user.email }).catch(() => {});
    }

    const res = NextResponse.redirect(new URL(next || '/account', base));
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error('[google-callback]', e);
    return errorRedirect('Google sign-in failed', base);
  }
}
