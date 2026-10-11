'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/Providers';

function Inner() {
  const app = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get('token') || '';
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (pw !== pw2) { setErr('Passwords do not match'); return; }
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pw }), credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Reset failed');
      router.push('/account');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card3">
        <div className="auth-promo3">
          <div className="brand3"><img src="/logo-icon.png" alt="" /><span>{app.settings.brand}</span></div>
          <span className="pill">Almost there</span>
          <h2>One click and you’re back in.</h2>
          <p className="desc">Choose a fresh password below. After saving, you’ll land straight on your account dashboard with all your orders and license keys.</p>
          <div className="perk-tiles">
            <div className="perk-tile"><div className="ic">🔒</div><b>Encrypted</b><span>Stored securely</span></div>
            <div className="perk-tile"><div className="ic">⚡</div><b>Auto sign-in</b><span>Right after save</span></div>
            <div className="perk-tile"><div className="ic">🔑</div><b>Your keys</b><span>Ready &amp; waiting</span></div>
          </div>
          <div className="promo-stats">
            <div><b>10.8K+</b><span>Developers</span></div>
            <div><b>52K+</b><span>Orders delivered</span></div>
            <div><b>4.9★</b><span>Avg rating</span></div>
          </div>
        </div>
        <div className="auth-form3">
          <div className="inner">
            <Link href="/login" className="back">← Back to sign in</Link>
            <h1>Choose a new password</h1>
            <p className="sub">Make it at least 6 characters. You’ll be signed in once you save.</p>
            {!token ? (
              <div style={errStyle}>Missing reset token. Use the link from your email.</div>
            ) : (
              <form onSubmit={submit}>
                <div className="field"><label>New password</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} autoFocus autoComplete="new-password" /></div>
                <div className="field"><label>Confirm password</label><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} autoComplete="new-password" /></div>
                {err && <div style={errStyle}>{err}</div>}
                <button type="submit" disabled={loading} className="btn btn-primary btn-xl btn-block">{loading ? <><span className="spinner"/> Saving…</> : 'Save new password →'}</button>
              </form>
            )}
            <div className="switch">Remember it? <Link href="/login">Sign in</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const errStyle = { padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 10, fontSize: 13.5, fontWeight: 600, marginBottom: 12 };
const loadingStyle = { minHeight: '60vh', display: 'grid', placeItems: 'center' };
export default function ResetPassword() {
  return <Suspense fallback={<div style={loadingStyle}>Loading…</div>}><Inner /></Suspense>;
}
