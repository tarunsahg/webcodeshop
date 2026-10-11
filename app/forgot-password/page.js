'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '@/components/Providers';

export default function ForgotPassword() {
  const app = useApp();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/auth/password-reset/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }), credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Request failed');
      setSent(true);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card3">
        <div className="auth-promo3">
          <div className="brand3"><img src="/logo-icon.png" alt="" /><span>{app.settings.brand}</span></div>
          <span className="pill">Account recovery</span>
          <h2>We’ve got you covered.</h2>
          <p className="desc">Forgot your password? It happens. Enter your email and we’ll send a secure link to set a new one in seconds.</p>
          <div className="perk-tiles">
            <div className="perk-tile"><div className="ic">🔐</div><b>Secure link</b><span>Private &amp; safe</span></div>
            <div className="perk-tile"><div className="ic">⚡</div><b>Instant</b><span>Sent right away</span></div>
            <div className="perk-tile"><div className="ic">✅</div><b>Auto sign-in</b><span>After reset</span></div>
          </div>
          <div className="promo-stats">
            <div><b>10.8K+</b><span>Developers</span></div>
            <div><b>52K+</b><span>Orders delivered</span></div>
            <div><b>4.9★</b><span>Avg rating</span></div>
          </div>
          <div className="promo-quote">
            <p>“Reset link landed instantly and I was back into my account in under a minute. Smooth.”</p>
            <div className="pq-author"><span className="pq-av">R</span><div><b>Rahul Verma</b><span>Web developer</span></div></div>
          </div>
        </div>
        <div className="auth-form3">
          <div className="inner">
            <Link href="/login" className="back">← Back to sign in</Link>
            {!sent ? (
              <>
                <h1>Reset your password</h1>
                <p className="sub">Enter your email and we’ll send you a link to choose a new password.</p>
                <form onSubmit={submit}>
                  <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" autoComplete="email" /></div>
                  {err && <div style={errStyle}>{err}</div>}
                  <button type="submit" disabled={loading} className="btn btn-primary btn-xl btn-block">{loading ? <><span className="spinner"/> Sending…</> : 'Send reset link →'}</button>
                </form>
              </>
            ) : (
              <div className="af-ok">
                <div className="af-ok-ico">✉️</div>
                <h1>Check your inbox</h1>
                <p className="sub">If an account exists for <b>{email}</b>, we just sent a password reset link. Check your inbox to continue.</p>
              </div>
            )}
            <div className="switch">Remember it? <Link href="/login">Sign in</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}
const errStyle = { padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 10, fontSize: 13.5, fontWeight: 600, marginBottom: 12 };
