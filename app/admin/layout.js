'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApp } from '@/components/Providers';

const NAV = [
  { href: '/admin', label: 'Dashboard', ic: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { href: '/admin/products', label: 'Products', ic: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' },
  { href: '/admin/categories', label: 'Categories', ic: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { href: '/admin/orders', label: 'Orders', ic: 'M3 6h2l2.4 11.2a2 2 0 002 1.6h7.6a2 2 0 002-1.6L20 9H6' },
  { href: '/admin/messages', label: 'Messages', ic: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { href: '/admin/coupons', label: 'Coupons', ic: 'M20 12a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 002 2 2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 00-2-2zM10 4v16' },
  { href: '/admin/customers', label: 'Customers', ic: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { href: '/admin/settings', label: 'Home & Style', ic: 'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a1 1 0 00.13-.2l2-3.46a1 1 0 00-.37-1.37l-2.12-1.22A7.07 7.07 0 0017.93 5l-.38-2.43a1 1 0 00-1-.85h-4a1 1 0 00-1 .85L11.18 5a7.07 7.07 0 00-1.11.64L7.95 4.42a1 1 0 00-1.37.37L4.46 8.25a1 1 0 00.37 1.37l2.12 1.22a7 7 0 000 2.32l-2.12 1.22a1 1 0 00-.37 1.37l2.12 3.46a1 1 0 001.37.37l2.12-1.22a7.07 7.07 0 001.11.64L11.55 21a1 1 0 001 .85h4a1 1 0 001-.85L17.93 19a7.07 7.07 0 001.11-.64l2.12 1.22a1 1 0 001.37-.37l2-3.46a1 1 0 00-.37-1.37l-2.12-1.22a7 7 0 000-2.32z' },
  { href: '/admin/reviews', label: 'Reviews', ic: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { href: '/admin/deal', label: 'Deal banner', ic: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01' },
  { href: '/admin/integrations', label: 'Integrations', ic: 'M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.71-1.71' },
  { href: '/admin/seo', label: 'SEO', ic: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z' },
  { href: '/admin/emails', label: 'Email templates', ic: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6' },
  { href: '/admin/footer', label: 'Footer', ic: 'M3 3h18v18H3zM3 15h18M9 19h6' },
];

function NavIcon({ d }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}

export default function AdminLayout({ children }) {
  const app = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!app) return;
    if (!app.authReady) return;
    if (pathname === '/admin/login') return;
    if (!app.admin) router.push('/admin/login');
  }, [app, pathname, router]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (pathname === '/admin/login') return <>{children}</>;
  if (!app || !app.authReady) return <div className="adm-boot">Loading…</div>;
  if (!app.admin) return null;

  const subBStyle = { fontSize: 11, fontWeight: 500, marginTop: 1, letterSpacing: '.04em', textTransform: 'uppercase' };
  const signOutStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, color: 'var(--muted)', fontSize: 14, fontWeight: 500, marginTop: 'auto', cursor: 'pointer', border: 0, background: 'transparent', width: '100%', textAlign: 'left' };

  return (
    <div className="adm-shell">
      <div className="adm-topbar">
        <button className="adm-burger" onClick={() => setOpen(true)} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <Link href="/admin" className="adm-topbar-brand">
          <img src="/logo-icon.png" alt={app.settings.brand} />
          <b>{app.settings.brand}</b>
        </Link>
      </div>
      {open && <div className="adm-overlay" onClick={() => setOpen(false)} />}
      <aside className={'adm-side' + (open ? ' open' : '')}>
        <button className="adm-side-close" onClick={() => setOpen(false)} aria-label="Close menu">×</button>
        <Link href="/admin" className="adm-brand" onClick={() => setOpen(false)}>
          <img src="/logo-icon.png" alt={app.settings.brand} className="adm-brand-img" />
          <div><b>{app.settings.brand}</b><div className="muted" style={subBStyle}>Admin</div></div>
        </Link>
        <nav>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={pathname === n.href ? 'on' : ''} onClick={() => setOpen(false)}>
              <NavIcon d={n.ic} /><span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={() => { app.adminLogout(); router.push('/admin/login'); }} style={signOutStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span>Sign out</span>
        </button>
      </aside>
      <div className="adm-main">{children}</div>
    </div>
  );
}
