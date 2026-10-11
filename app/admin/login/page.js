'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';

export default function AdminLoginPage() {
  const app = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const r = await app.adminLogin(email, password);
    setBusy(false);
    if (!r.ok) { setErr(r.error || 'Sign in failed'); return; }
    router.push('/admin');
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={logoRowStyle}>
          <img src="/logo-icon.png" alt={app?.settings?.brand || 'WebCodeShop'} style={logoStyle} />
          <div>
            <div style={brandRowStyle}>{app?.settings?.brand || 'WebCodeShop'}</div>
            <div style={badgeStyle}>ADMIN PANEL</div>
          </div>
        </div>
        <h1>Admin sign in</h1>
        <p className="sub">Manage your storefront — products, orders, coupons, and home page style.</p>
        <form onSubmit={submit}>
          <div className="field"><label>Admin email</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></div>
          <div className="field"><label>Password</label><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
          {err && <div style={errStyle}>{err}</div>}
          <button type="submit" disabled={busy} className="btn btn-primary btn-lg btn-block" style={btnStyle}>{busy ? 'Signing in…' : 'Continue to admin →'}</button>
        </form>
        <p className="muted" style={footStyle}><Link href="/" style={linkStyle}>← Back to storefront</Link></p>
      </div>
    </div>
  );
}
const logoRowStyle = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 };
const logoStyle = { width: 48, height: 48, borderRadius: 10 };
const brandRowStyle = { fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text)' };
const badgeStyle = { display: 'inline-block', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', marginTop: 4 };
const fillBtnStyle = { marginLeft: 8, padding: '2px 10px', fontSize: 12 };
const errStyle = { color: '#dc2626', fontSize: 13, marginBottom: 12, padding: 10, background: '#fef2f2', borderRadius: 8 };
const btnStyle = { marginTop: 8 };
const footStyle = { textAlign: 'center', marginTop: 22, fontSize: 14 };
const linkStyle = { color: 'var(--accent)', fontWeight: 600 };
