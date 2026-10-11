'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';

export default function Register() {
  const app = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await app.register(name, email, pw);
    setBusy(false);
    if (res.ok) router.push('/account');
    else setErr(res.error || 'Registration failed');
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card3">
        <div className="auth-promo3">
          <div className="brand3"><img src="/logo-icon.png" alt="" /><span>{app.settings.brand}</span></div>
          <span className="pill">Free — join in 30 seconds</span>
          <h2>Welcome to the club</h2>
          <p className="desc">Get exclusive promo codes, early access to new drops, and a curated weekly digest of the best new products.</p>
          <div className="perk-tiles">
            <div className="perk-tile"><div className="ic">🎁</div><b>10% off</b><span>Code WELCOME10</span></div>
            <div className="perk-tile"><div className="ic">🚀</div><b>Early access</b><span>See drops first</span></div>
            <div className="perk-tile"><div className="ic">📬</div><b>One email/week</b><span>No spam, ever</span></div>
          </div>
          <div className="promo-stats">
            <div><b>10.8K+</b><span>Developers</span></div>
            <div><b>52K+</b><span>Orders delivered</span></div>
            <div><b>4.9★</b><span>Avg rating</span></div>
          </div>
          <div className="promo-quote">
            <p>“Signed up, grabbed my welcome code, and shipped a client site the same night. Worth every second.”</p>
            <div className="pq-author"><span className="pq-av">P</span><div><b>Priya Nair</b><span>Indie maker</span></div></div>
          </div>
        </div>
        <div className="auth-form3">
          <div className="inner">
            <Link href="/" className="back">← Back to shop</Link>
            <h1>Create your account</h1>
            <p className="sub">It’s free. No credit card. Get notified when new products drop.</p>
            <a href="/api/auth/google?next=/account" className="oauth-btn">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.13 4.13 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.86 2.69-6.61z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.9-2.26c-.81.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.06-3.72H.96v2.34A8.99 8.99 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.94 10.69a5.41 5.41 0 0 1 0-3.38V4.97H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.98-2.34z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.96 8.96 0 0 0 9 0 8.99 8.99 0 0 0 .96 4.97l2.98 2.34C4.66 5.18 6.65 3.58 9 3.58z"/></svg>
              <span>Sign up with Google</span>
            </a>
            <div className="oauth-or"><span>or with email</span></div>
            <form onSubmit={submit}>
              <div className="field"><label>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} required/></div>
              <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></div>
              <div className="field"><label>Password</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6}/></div>
              {err && <div style={errStyle}>{err}</div>}
              <button type="submit" disabled={busy} className="btn btn-primary btn-xl btn-block">{busy ? <><span className="spinner"/> Creating account…</> : 'Create account →'}</button>
            </form>
            <div className="switch">Already have an account? <Link href="/login">Sign in</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}
const errStyle = { padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 10, fontSize: 13.5, fontWeight: 600, marginBottom: 12 };
