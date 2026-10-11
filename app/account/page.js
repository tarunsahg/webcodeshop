'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { money, fmtDate } from '@/lib/format';

function orderStatusInfo(status, hasKeys) {
  if (status === 'pending') return { label: 'Pending', bg: '#fef3c7', fg: '#92400e' };
  if (status === 'failed') return { label: 'Failed', bg: '#fee2e2', fg: '#991b1b' };
  if (status === 'completed' && !hasKeys) return { label: 'Processing', bg: '#dbeafe', fg: '#1e40af' };
  return { label: 'Completed', bg: '#dcfce7', fg: '#166534' };
}

export default function Account() {
  const app = useApp();
  const router = useRouter();
  useEffect(() => {
    if (app && app.authReady && !app.user) router.push('/login?next=/account');
  }, [app, router]);
  if (!app || !app.authReady) return <div className="container" style={loadStyle}>Loading…</div>;
  if (!app.user) return null;

  const orders = (app.orders || []).filter((o) => o.userId === app.user.id || o.email === app.user.email);
  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalKeys = orders.reduce((s, o) => s + ((o.keys && o.keys.length) || 0), 0);
  const initials = app.user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="acct-v2">
      <div className="acct-head">
        <div className="who">
          <div className="av">{app.user.avatar ? <img src={app.user.avatar} alt="" /> : initials}</div>
          <div>
            <h1>Welcome back, {app.user.name.split(' ')[0]}</h1>
            <p>{app.user.email}</p>
          </div>
        </div>
        <button onClick={() => { app.logout(); router.push('/'); }} className="btn btn-ghost">Sign out</button>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="lbl">Total orders</div>
          <div className="vl">{orders.length}</div>
          <div className="ic" style={icBlue}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h2l2 12h12"/><circle cx="10" cy="21" r="1"/><circle cx="19" cy="21" r="1"/></svg></div>
        </div>
        <div className="stat-card">
          <div className="lbl">Total spent</div>
          <div className="vl">{money(totalSpent)}</div>
          <div className="ic" style={icOrange}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
        </div>
        <div className="stat-card">
          <div className="lbl">License keys</div>
          <div className="vl">{totalKeys}</div>
          <div className="ic" style={icTeal}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L18 5l3 3-2 2 2 2-3 3-3-3-3 3"/></svg></div>
        </div>
      </div>

      <Link href="/wishlist" className="acct-wishlist">
        <span className="aw-ic">♡</span>
        <span className="aw-tx">
          <b>My wishlist</b>
          <span>{(app.wishlistIds || []).length} item{(app.wishlistIds || []).length === 1 ? '' : 's'} saved for later</span>
        </span>
        <span className="aw-arrow">→</span>
      </Link>

      <h2>Order history</h2>
      {orders.length === 0 ? (
        <div className="shop-empty">
          <div className="ic">📦</div>
          <h3>No orders yet</h3>
          <p className="muted" style={emptyP}>Your purchases will show up here with copyable license keys.</p>
          <Link href="/shop" className="btn btn-primary">Browse products</Link>
        </div>
      ) : (
        <div className="acct-order-list">
          {orders.map((o) => {
            const hasKeys = o.keys && o.keys.length > 0;
            const sk = orderStatusInfo(o.status, hasKeys);
            const badgeStyle = { background: sk.bg, color: sk.fg };
            const itemCount = (o.items || []).length;
            return (
              <div key={o.id} className="acct-order-row">
                <div className="aor-main">
                  <div className="aor-id">Order {o.id}</div>
                  <div className="aor-meta">{fmtDate(o.date)} · {itemCount} item{itemCount === 1 ? '' : 's'} · {money(o.total)}</div>
                </div>
                <span className="badge" style={badgeStyle}>{sk.label}</span>
                <Link href={'/account/orders/' + o.id} className="aor-track"><span className="aor-track-ic">📦</span> Track order</Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const loadStyle = { padding: '80px 20px', textAlign: 'center', color: 'var(--muted)' };
const icBlue = { background: 'linear-gradient(135deg,#1e64ff,#4a8bff)' };
const icOrange = { background: 'linear-gradient(135deg,#f57c3a,#ff9a5a)' };
const icTeal = { background: 'linear-gradient(135deg,#2bbf95,#4ad3ad)' };
const ordIdStyle = { fontWeight: 700, fontSize: 14.5, color: 'var(--text)' };
const ordMetaStyle = { fontSize: 12.5, color: 'var(--muted)', marginTop: 3 };
const emptyP = { marginTop: 6, marginBottom: 18 };
