'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/components/Providers';

export default function Login() {
  const app = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/account';
  const oauthErr = sp.get('error');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await app.login(email, pw);
    setBusy(false);
    if (res.ok) router.push(next);
    else setErr(res.error || 'Login failed');
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card3">
        <div className="auth-promo3">
          <div className="brand3"><img src="/logo-icon.png" alt="" /><span>{app.settings.brand}</span></div>
          <span className="pill">Premium code marketplace</span>
          <h2>Build faster with production-ready code</h2>
          <p className="desc">Join 10,800+ developers shipping faster with our curated library of PHP, HTML &amp; JavaScript products.</p>
          <div className="perk-tiles">
            <div className="perk-tile"><div className="ic">⚡</div><b>Instant delivery</b><span>Keys in your inbox</span></div>
            <div className="perk-tile"><div className="ic">🔄</div><b>Lifetime updates</b><span>Free fixes forever</span></div>
            <div className="perk-tile"><div className="ic">🛡️</div><b>Secure delivery</b><span>Signed download links</span></div>
          </div>
          <div className="promo-stats">
            <div><b>10.8K+</b><span>Developers</span></div>
            <div><b>52K+</b><span>Orders delivered</span></div>
            <div><b>4.9★</b><span>Avg rating</span></div>
          </div>
          <div className="promo-quote">
            <p>“Instant delivery, clean code, and updates that actually keep coming. Easily the best code marketplace I've used.”</p>
            <div className="pq-author"><span className="pq-av">A</span><div><b>Arjun Mehta</b><span>Full-stack developer</span></div></div>
          </div>
        </div>
        <div className="auth-form3">
          <div className="inner">
            <Link href="/" className="back">← Back to shop</Link>
            <h1>Welcome back</h1>
            <p className="sub">Sign in to access your orders, license keys, and downloads.</p>
            {oauthErr && <div style={errStyle}>{oauthErr}</div>}
            <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="oauth-btn">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.13 4.13 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.86 2.69-6.61z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.9-2.26c-.81.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.06-3.72H.96v2.34A8.99 8.99 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.94 10.69a5.41 5.41 0 0 1 0-3.38V4.97H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.98-2.34z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.96 8.96 0 0 0 9 0 8.99 8.99 0 0 0 .96 4.97l2.98 2.34C4.66 5.18 6.65 3.58 9 3.58z"/></svg>
              <span>Continue with Google</span>
            </a>
            <div className="oauth-or"><span>or sign in with email</span></div>
            <form onSubmit={submit}>
              <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></div>
              <div className="field"><label>Password</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required/></div>
              <div className="forgot-row"><Link href="/forgot-password">Forgot password?</Link></div>
              {err && <div style={errStyle}>{err}</div>}
              <button type="submit" disabled={busy} className="btn btn-primary btn-xl btn-block">{busy ? <><span className="spinner"/> Signing in…</> : 'Sign in →'}</button>
            </form>
            <div className="switch">New here? <Link href="/register">Create an account</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}
const errStyle = { padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 10, fontSize: 13.5, fontWeight: 600, marginBottom: 12 };
