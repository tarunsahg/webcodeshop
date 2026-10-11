import 'server-only';
import crypto from 'crypto';
import { db, hashPassword } from './db.js';
import { signToken, setSessionCookie } from './auth-server.js';

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SCOPE = 'openid email profile';

// Reads Google OAuth credentials saved in Admin -> Integrations (settings table),
// falling back to environment variables. This makes Google sign-in fully
// configurable from the admin UI without redeploying.
function getGoogleConfig() {
  const s = {};
  try {
    const rows = db().prepare("SELECT key,value FROM settings WHERE key IN ('googleClientId','googleClientSecret','googleRedirectUri')").all();
    for (const r of rows) { try { s[r.key] = JSON.parse(r.value); } catch { s[r.key] = r.value; } }
  } catch {}
  const clientId = (s.googleClientId || process.env.GOOGLE_CLIENT_ID || '').toString().trim();
  const clientSecret = (s.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '').toString().trim();
  const redirectUri = (s.googleRedirectUri || process.env.GOOGLE_REDIRECT_URI || (APP_URL + '/api/auth/google/callback')).toString().trim();
  return { clientId, clientSecret, redirectUri };
}

export function isGoogleConfigured() {
  const { clientId, clientSecret } = getGoogleConfig();
  return !!(clientId && clientSecret);
}

export function getAuthUrl(state, next) {
  const { clientId, redirectUri } = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'online',
    prompt: 'select_account',
    state: state + ':' + encodeURIComponent(next || '/account'),
  });
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
}

export async function exchangeCode(code) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: redirectUri, grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error('Google token exchange failed: ' + res.status);
  return await res.json();
}

export async function fetchProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { 'Authorization': 'Bearer ' + accessToken },
  });
  if (!res.ok) throw new Error('Google userinfo failed: ' + res.status);
  return await res.json(); // { sub, email, email_verified, name, picture, ... }
}

/*
  Finds or creates a local user for the Google profile and links the OAuth account.
*/
export function findOrCreateOAuthUser(profile) {
  const d = db();
  const sub = String(profile.sub);
  const email = String(profile.email || '').toLowerCase().trim();
  const name = profile.name || email.split('@')[0] || 'Google User';
  const avatar = profile.picture || null;

  const linked = d.prepare('SELECT user_id FROM oauth_accounts WHERE provider=? AND provider_user_id=?').get('google', sub);
  if (linked) {
    if (avatar) d.prepare('UPDATE users SET avatar=COALESCE(avatar,?) WHERE id=?').run(avatar, linked.user_id);
    return d.prepare('SELECT id,name,email,role,avatar,provider,created_at FROM users WHERE id=?').get(linked.user_id);
  }

  let user = email ? d.prepare('SELECT id,name,email,role,avatar,provider,created_at FROM users WHERE email=?').get(email) : null;
  if (!user) {
    const randomPw = crypto.randomBytes(24).toString('hex');
    const info = d.prepare('INSERT INTO users (name,email,password,role,avatar,provider) VALUES (?,?,?,?,?,?)')
      .run(name, email, hashPassword(randomPw), 'customer', avatar, 'google');
    user = d.prepare('SELECT id,name,email,role,avatar,provider,created_at FROM users WHERE id=?').get(info.lastInsertRowid);
  } else if (avatar && !user.avatar) {
    d.prepare('UPDATE users SET avatar=? WHERE id=?').run(avatar, user.id);
    user.avatar = avatar;
  }

  d.prepare('INSERT OR IGNORE INTO oauth_accounts (provider,provider_user_id,user_id,email) VALUES (?,?,?,?)').run('google', sub, user.id, email);
  return user;
}

// Returns a signed session token for the OAuth user. The caller is responsible
// for attaching it to the response via setSessionCookie(res, token), which is
// the reliable way to set cookies from a route handler / redirect response.
export function loginOAuthUser(user) {
  return signToken({ userId: user.id, role: user.role });
}

// CSRF state token: random nonce stored in a cookie + included in state param
export function makeState() {
  return crypto.randomBytes(20).toString('base64url');
}
