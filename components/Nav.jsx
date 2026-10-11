'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { money } from '@/lib/format';
import { useApp } from './Providers';

function Icon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>
  );
}
function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4"/>
      <circle cx="17" cy="20" r="1.4"/>
      <path d="M2.5 3.5h2.3l2 11a1.8 1.8 0 001.8 1.5h7.6a1.8 1.8 0 001.8-1.4L21 8H6"/>
    </svg>
  );
}
function SearchIcon() { return <Icon d="M21 21l-4.3-4.3M11 18a7 7 0 110-14 7 7 0 010 14z" size={15}/>; }
function ChevronDown() { return <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>; }

const CAT_META = {
  php:      { color: 'linear-gradient(135deg,#6366f1,#8b5cf6)', desc: 'CMS, eCommerce & admin scripts' },
  html:     { color: 'linear-gradient(135deg,#f97316,#ec4899)', desc: 'Landing pages, dashboards, themes' },
  js:       { color: 'linear-gradient(135deg,#10b981,#34d399)', desc: 'React, Vue & vanilla JS apps' },
  wp:       { color: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', desc: 'WordPress themes & plugins' },
  giftcard: { color: 'linear-gradient(135deg,#f59e0b,#fbbf24)', desc: 'Instant digital gift cards' },
};

export default function Nav() {
  const app = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const megaRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocus(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => { setMobileOpen(false); setMegaOpen(false); setUserOpen(false); }, [pathname]);

  if (!app) return null;
  const cartCount = app.cart.reduce((s, c) => s + c.qty, 0);
  const active = (h) => pathname === h ? 'on' : '';
  const submitSearch = (e) => {
    e.preventDefault();
    if (search.trim()) router.push('/shop?q=' + encodeURIComponent(search.trim()));
  };
  const initials = app.user ? app.user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '';
  const categories = app.categories || [];
  const sq = search.trim().toLowerCase();
  const searchMatches = sq ? (app.products || []).filter((p) => (p.name || '').toLowerCase().includes(sq) || (p.desc || '').toLowerCase().includes(sq)).slice(0, 6) : [];

  return (
    <>
      <header className={'nav nav-v2' + (scrolled ? ' is-scrolled' : '')}>
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <img src="/logo-icon.png" alt={app.settings.brand} className="brand-img"/>
            <span>{app.settings.brand}</span>
          </Link>

          <nav className="nav-links-v2" ref={megaRef}>
            <Link href="/" className={active('/')}>Home</Link>
            <div className={'has-mega' + (megaOpen ? ' open' : '')} style={megaWrapStyle}>
              <button onClick={() => setMegaOpen(v => !v)} type="button">
                Categories <ChevronDown/>
              </button>
              <div className={'nav-mega' + (megaOpen ? ' open' : '')}>
                <div className="col">
                  <h6>Browse by type</h6>
                  {categories.map((c) => {
                    const m = CAT_META[c.id] || { color: 'linear-gradient(135deg,#1e64ff,#4a8bff)', desc: '' };
                    const icStyle = { background: m.color };
                    return (
                      <Link key={c.id} href={'/shop?c=' + c.id} className="mlink">
                        <div className="ic" style={icStyle}>{c.image ? <img className="cat-ic-img" src={c.image} alt="" /> : c.icon}</div>
                        <div className="t"><b>{c.name}</b><span>{c.sub || m.desc}</span></div>
                      </Link>
                    );
                  })}
                </div>
                <div className="col">
                  <div className="featured">
                    <div>
                      <div className="lbl">Featured</div>
                      <h4>Premium production-ready code</h4>
                      <p>Hand-picked scripts, templates and apps with lifetime updates.</p>
                    </div>
                    <Link href="/shop" className="btn btn-primary btn-sm" style={featBtnStyle}>Browse all →</Link>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/shop" className={active('/shop')}>Shop</Link>
            <Link href="/shop?c=giftcard">Gift cards</Link>
            <Link href="/deals" className={active('/deals')}>{app?.settings?.dealPageName || 'Deals'}</Link>
          </nav>

          <form className="nav-search-v2" onSubmit={submitSearch} ref={searchRef}>
            <SearchIcon/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => setSearchFocus(true)} placeholder="Search products…"/>
            {searchFocus && sq && (
              <div className="nav-search-drop">
                {searchMatches.length ? searchMatches.map((p) => (
                  <Link key={p.id} href={'/product/' + p.id} className="nsd-item" onClick={() => { setSearch(''); setSearchFocus(false); }}>
                    <span className="nsd-ic">{p.image ? <img src={p.image} alt="" /> : p.icon}</span>
                    <span className="nsd-info"><b>{p.name}</b><span>{money(p.price)}</span></span>
                  </Link>
                )) : <div className="nsd-empty">No products found</div>}
              </div>
            )}
          </form>

          <div className="nav-right-v2">
            <Link href="/help" className="nav-help-link">Help Center</Link>
            <Link href="/cart" className="icon-btn-v2" aria-label="Cart">
              <CartIcon/>
              {cartCount > 0 && <span className="cart-badge" key={cartCount}>{cartCount}</span>}
            </Link>

            {app.user ? (
              <div className="user-menu" ref={userRef}>
                <button className="avatar-btn" onClick={() => setUserOpen(v => !v)} aria-label="Account">{app.user.avatar ? <img src={app.user.avatar} alt="" className="avatar-img"/> : initials}</button>
                <div className={'user-dropdown' + (userOpen ? ' open' : '')}>
                  <div className="udhead">
                    <b>{app.user.name}</b>
                    <span>{app.user.email}</span>
                  </div>
                  <Link href="/account"><Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/> My account</Link>
                  <Link href="/account"><Icon d="M3 6h2l2 12h12l2-9H6"/> My orders</Link>
                  <Link href="/wishlist"><Icon d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"/> My wishlist</Link>
                  <div className="udsep"/>
                  <button onClick={() => { app.logout(); router.push('/'); }}><Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/> Sign out</button>
                </div>
              </div>
            ) : (
              <>
                <div className="nav-auth-d">
                  <Link href="/login" className="btn btn-ghost btn-sm" style={signInStyle}>Sign in</Link>
                  <Link href="/register" className="btn btn-primary btn-sm">Sign up</Link>
                </div>
                <Link href="/login" className="icon-btn-v2 nav-login-m" aria-label="Log in">
                  <span className="nav-login-av"><Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" size={16}/></span>
                </Link>
              </>
            )}

            <button className="icon-btn-v2 menu-btn" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Icon d="M3 12h18M3 6h18M3 18h18"/>
            </button>
          </div>
        </div>
      </header>

      <div className={'mobile-menu' + (mobileOpen ? ' open' : '')} onClick={() => setMobileOpen(false)}>
        <div className="mobile-panel" onClick={(e) => e.stopPropagation()}>
          <div className="mm-head">
            <Link href="/" className="mm-brand">
              <img src="/logo-icon.png" alt={app.settings.brand}/>
              <span>{app.settings.brand}</span>
            </Link>
            <button className="mm-close" onClick={() => setMobileOpen(false)} aria-label="Close"><Icon d="M18 6L6 18M6 6l12 12"/></button>
          </div>

          <form className="mm-search" onSubmit={submitSearch}>
            <SearchIcon/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"/>
            {sq && (
              <div className="nav-search-drop mm-search-drop">
                {searchMatches.length ? searchMatches.map((p) => (
                  <Link key={p.id} href={'/product/' + p.id} className="nsd-item" onClick={() => { setSearch(''); setMobileOpen(false); }}>
                    <span className="nsd-ic">{p.image ? <img src={p.image} alt="" /> : p.icon}</span>
                    <span className="nsd-info"><b>{p.name}</b><span>{money(p.price)}</span></span>
                  </Link>
                )) : <div className="nsd-empty">No products found</div>}
              </div>
            )}
          </form>

          <nav className="mm-nav">
            <Link href="/" className="mm-link"><Icon d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/> <span>Home</span></Link>
            <Link href="/shop" className="mm-link"><Icon d="M3 9h18l-1 11H4zM8 9V6a4 4 0 018 0v3"/> <span>Shop all</span></Link>
            <Link href="/deals" className="mm-link"><Icon d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01"/> <span>{app?.settings?.dealPageName || 'Deals'}</span></Link>
            <Link href="/help" className="mm-link"><Icon d="M12 17h.01M12 13a2 2 0 10-2-2M3 12a9 9 0 1018 0 9 9 0 00-18 0z"/> <span>Help Center</span></Link>
          </nav>

          <div className="mm-label">Browse by category</div>
          <div className="mm-cats">
            {categories.map((c) => {
              const m = CAT_META[c.id] || { color: 'linear-gradient(135deg,#1e64ff,#4a8bff)' };
              const catIcStyle = { background: m.color };
              return (
                <Link key={c.id} href={'/shop?c=' + c.id} className="mm-cat">
                  <span className="mm-cat-ic" style={catIcStyle}>{c.image ? <img className="cat-ic-img" src={c.image} alt="" /> : c.icon}</span>
                  <span className="mm-cat-nm">{c.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="mm-foot">
            {app.user ? (
              <>
                <Link href="/account" className="mm-link"><Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/> <span>My account</span></Link>
                <Link href="/wishlist" className="mm-link"><Icon d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"/> <span>My wishlist</span></Link>
                <a className="mm-link mm-signout" onClick={() => { app.logout(); router.push('/'); }}><Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/> <span>Sign out</span></a>
              </>
            ) : (
              <>
                <Link href="/login" className="mm-link"><Icon d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/> <span>Log in</span></Link>
                <Link href="/register" className="mm-link"><Icon d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6"/> <span>Create account</span></Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
const megaWrapStyle = { position: 'static' };
const featBtnStyle = { alignSelf: 'flex-start' };
const signInStyle = { padding: '8px 14px' };

