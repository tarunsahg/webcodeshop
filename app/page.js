'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useApp } from '@/components/Providers';
import ProductCard from '@/components/ProductCard';
import HeroVisual from '@/components/HeroVisual';
import { catName } from '@/lib/format';
import MobileSearch from '@/components/MobileSearch';

const CAT_COLORS = {
  php:      'linear-gradient(135deg,#6366f1,#8b5cf6)',
  html:     'linear-gradient(135deg,#f97316,#ec4899)',
  js:       'linear-gradient(135deg,#10b981,#34d399)',
  wp:       'linear-gradient(135deg,#0ea5e9,#3b82f6)',
  giftcard: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
};

const LOGOS = ['Lumio','NimbusOps','Acme Forge','Pulseware','HelixCloud','Northbeam','Arcfield','Vivid Labs','OctaDesk','Bytewave'];

const FEATURES = [
  { ic: 'blue',   t: 'Instant delivery',  d: 'License keys are emailed and shown on your account the second payment clears.', svg: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { ic: 'orange', t: 'Lifetime updates',  d: 'Every product ships with free lifetime updates and bug fixes. No subscriptions.', svg: 'M21 12a9 9 0 11-2.64-6.36M21 4v5h-5' },
  { ic: 'teal',   t: 'Audited source',    d: 'Every script is reviewed for security and clean code before it goes on the shop.', svg: 'M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z' },
  { ic: 'navy',   t: 'Secure delivery',   d: 'Every purchase is delivered through private, secure download links — your files stay yours alone.', svg: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
];

const FAQS = [
  { q: 'How do I receive my purchase?', a: 'Right after checkout, your license keys appear in your account dashboard and a copy is emailed to you. Download your files anytime from your account using a secure, time-limited link.' },
  { q: 'Can I use these products commercially?', a: 'Yes. Every product on WebCodeShop ships with a commercial license unless explicitly marked otherwise on the product page.' },
  { q: 'How are my downloads protected?', a: 'Every download uses a private, secure link, so only you can access your purchased files. Your keys are always saved to your account too.' },
  { q: 'How are updates delivered?', a: 'Lifetime updates are included with every product. Updates appear in your account dashboard and you get an email when they drop.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major cards, PayPal, and Stripe Link. Crypto is coming soon.' },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return;
    const el = ref.current;
    const items = el.querySelectorAll('.reveal, .reveal-stagger');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-in'); });
    }, { threshold: 0.12 });
    items.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);
  return ref;
}

function ArrowIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
}

export default function Home() {
  const app = useApp();
  const wrapRef = useReveal();
  if (!app) return null;
  const s = app.settings;
  const reviews = (Array.isArray(s.homeReviews) && s.homeReviews.length) ? s.homeReviews : TESTIMONIALS;
  const products = app.products;
  const trendingPicks = products.filter((p) => p.trending);
  const featured = (trendingPicks.length ? trendingPicks : [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0))).slice(0, 8);
  const newPicks = products.filter((p) => p.newArrival);
  const newest = (newPicks.length ? newPicks : [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))).slice(0, 4);
  const heroHtml = { __html: s.h1 };
  const marqueeLogos = [...LOGOS, ...LOGOS];

  return (
    <div ref={wrapRef} className="home-main">
      {/* MOBILE HOME (mobile only) */}
      <div className="m-home">
        <div className="container">
          <MobileSearch/>
          <div className="m-banner">
            <div className="m-banner-glow"/>
            <div className="m-banner-body">
              <span className="m-banner-tag">⚡ {s.eb}</span>
              <h2>Premium code &amp; scripts, delivered in seconds</h2>
              <p>Production-ready PHP &amp; HTML apps, templates and instant gift cards.</p>
              <Link href="/shop" className="m-banner-btn">{s.cta} →</Link>
            </div>
          </div>
          <div className="m-sec-label">Shop by category</div>
          <div className="m-cats-row">
            <Link href="/shop" className="m-cat-chip"><span className="m-cat-ic">🛍️</span><span className="m-cat-nm">All</span></Link>
            {(app.categories || []).map((c) => (
              <Link key={c.id} href={'/shop?c=' + c.id} className="m-cat-chip">
                <span className="m-cat-ic">{c.image ? <img src={c.image} alt="" /> : c.icon}</span>
                <span className="m-cat-nm">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE DEAL BANNER (mobile only) */}
      {(s.dealEnabled || 'on') === 'on' && (
      <div className="m-mid">
        <div className="container">
          <div className="m-deal">
            <div className="m-deal-glow"/>
            <div className="m-deal-body">
              <span className="m-deal-tag">{s.dealTag || '🎁 Limited time'}</span>
              <h3>{s.dealTitle || 'Save 25% on bestsellers'}</h3>
              <p>Use code <b>{s.dealCode || 'WCS25'}</b> at checkout</p>
              <Link href={s.dealLink || '/shop'} className="m-deal-btn">{s.dealCta || 'Shop deals'} →</Link>
            </div>
            <div className="m-deal-art"><span>{s.dealBig || '25%'}</span><small>{s.dealSmall || 'OFF'}</small></div>
          </div>
        </div>
      </div>
      )}

      {/* HERO */}
      <section className="hero hero-v3">
        <div className="grid-overlay"/>
        <div className="container hero-grid">
          <div className="reveal-stagger">
            <div className="eyebrow">
              <span className="dot"/>
              <span>{s.eb}</span>
              <span className="new-pill">NEW</span>
            </div>
            <h1 dangerouslySetInnerHTML={heroHtml}/>
            <p className="hero-sub">{s.sub}</p>
            <div className="hero-cta">
              <Link href="/shop" className="btn btn-primary btn-xl">{s.cta} <ArrowIcon/></Link>
              <Link href="/shop?c=giftcard" className="btn btn-outline btn-xl">View gift cards</Link>
            </div>
            <div className="hero-trust">
              <div className="avatars">
                <div style={avA}>JS</div><div style={avB}>DP</div><div style={avC}>MR</div><div style={avD}>+1k</div>
              </div>
              <div className="txt"><b>10,800+ developers</b> ship faster with us</div>
              <span className="sep"/>
              <div className="hero-trust"><span className="stars">★★★★★</span><span className="txt">4.9 · 1,250 reviews</span></div>
            </div>
          </div>
          <div className="reveal"><HeroVisual/></div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="marquee">
        <div className="container">
          <div className="lbl">Trusted by teams at high-velocity companies</div>
        </div>
        <div className="marq-track">
          {marqueeLogos.map((l, i) => <div key={i} className="logo">{l}</div>)}
        </div>
      </section>

      {/* STATS */}
      <section className="stats-band">
        <div className="container stats-grid reveal-stagger">
          <div className="stat-block"><div className="num">10.8K+</div><div className="lbl">Active developers</div></div>
          <div className="stat-block"><div className="num orange">52K+</div><div className="lbl">Orders delivered</div></div>
          <div className="stat-block"><div className="num teal">4.9/5</div><div className="lbl">Average rating</div></div>
          <div className="stat-block"><div className="num">99.9%</div><div className="lbl">Uptime guarantee</div></div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="sec home-cats">
        <div className="container">
          <div className="sec-head-v2 reveal">
            <div className="sec-tag">Browse by category</div>
            <h2>Find exactly what you need</h2>
            <p>From production PHP scripts to React dashboards and instant gift cards — everything you need to ship faster.</p>
          </div>
          <div className="cat-grid-v2 reveal-stagger">
            {(app.categories || []).map((c) => {
              const icStyle = { background: CAT_COLORS[c.id] || 'var(--grad-2)' };
              const cardStyle = { '--cat-color': (CAT_COLORS[c.id] || 'var(--accent)').split(',')[1] || 'var(--accent)' };
              const n = products.filter((p) => p.cat === c.id).length;
              return (
                <Link key={c.id} href={'/shop?c=' + c.id} className="cat-card-v2" style={cardStyle}>
                  <div className="ic" style={icStyle}>{c.image ? <img className="cat-ic-img" src={c.image} alt="" /> : c.icon}</div>
                  <div>
                    <b>{c.name}</b>
                    {c.sub ? <div className="cat-sub">{c.sub}</div> : null}
                    <div className="c">{n} product{n === 1 ? '' : 's'}</div>
                  </div>
                  <div className="count">Browse <ArrowIcon/></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="sec home-featured" style={secAltStyle}>
        <div className="container">
          <div className="sec-head-v2 reveal">
            <div className="sec-tag">Bestsellers</div>
            <h2>Trending right now</h2>
            <p>The most-downloaded code, templates and apps on WebCodeShop this week.</p>
          </div>
          <div className="p-grid reveal-stagger">
            {featured.slice(0, 4).map((p) => <ProductCard key={p.id} p={p}/>)}
          </div>
          <div style={ctaCenter}>
            <Link href="/shop" className="btn btn-outline btn-lg">View all products <ArrowIcon/></Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="sec">
        <div className="container">
          <div className="sec-head-v2 reveal">
            <div className="sec-tag">Why WebCodeShop</div>
            <h2>Built for developers who ship</h2>
            <p>The shortcuts you wish you'd had on your last project.</p>
          </div>
          <div className="feat-grid-v2 reveal-stagger">
            {FEATURES.map((f, i) => (
              <div key={i} className="feat-v2">
                <div className={'ic ' + f.ic}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={f.svg}/></svg></div>
                <b>{f.t}</b>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="sec home-newest" style={secAltStyle}>
        <div className="container">
          <div className="sec-head-v2 reveal">
            <div className="sec-tag">Fresh drops</div>
            <h2>New arrivals</h2>
            <p>Just-shipped products from our independent developer community.</p>
          </div>
          <div className="p-grid reveal-stagger">
            {newest.map((p) => <ProductCard key={p.id} p={p}/>)}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="sec">
        <div className="container">
          <div className="sec-head-v2 reveal">
            <div className="sec-tag">Loved by builders</div>
            <h2>From customers we admire</h2>
            <p>Real reviews from indie hackers, startup teams, and enterprise engineers.</p>
          </div>
          <div className="tst-grid-v2 reveal-stagger">
            {reviews.map((t, i) => {
              const avStyle = { background: t.color || t.c };
              const nm = t.name || t.n || '';
              const parts = String(nm).trim().split(' ').filter(Boolean);
              const initials = (((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '')).toUpperCase();
              const rating = Math.max(1, Math.min(5, Number(t.rating) || 5));
              return (
                <div key={t.id || i} className="tst-card-v2">
                  <div className="stars">{'★'.repeat(rating)}</div>
                  <p className="quote">“{t.quote || t.t}”</p>
                  <div className="author">
                    <div className="av" style={avStyle}>{(t.i || initials) || '?'}</div>
                    <div>
                      <div className="nm">{nm}</div>
                      <div className="role">{t.role || t.r}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec" style={secAltStyle}>
        <div className="container">
          <div className="sec-head-v2 reveal">
            <div className="sec-tag">Questions</div>
            <h2>Frequently asked</h2>
            <p>Everything you need to know before you check out.</p>
          </div>
          <div className="faq-list reveal-stagger">
            {FAQS.map((f, i) => (
              <details key={i} className="faq-item">
                <summary>{f.q}<span className="plus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg></span></summary>
                <div className="body">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter">
        <div className="container">
          <div className="newsletter-card reveal">
            <div className="lbl">Stay in the loop</div>
            <h2>Get new product drops first</h2>
            <p>One thoughtful email a week with fresh products, promo codes, and behind-the-scenes from indie developers.</p>
            <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); app.showToast('Subscribed — check your inbox!', 'success'); }}>
              <input type="email" placeholder="you@email.com" required/>
              <button type="submit">Subscribe</button>
            </form>
            <div className="perks">
              <span>No spam</span>
              <span>Unsubscribe anytime</span>
              <span>Promo codes inside</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const TESTIMONIALS = [
  { n: 'Maya Chen', r: 'Lead Engineer, Lumio', i: 'MC', c: 'linear-gradient(135deg,#1e64ff,#0b1f4d)', t: 'The React Dashboard Pro saved us three weeks of UI work. Crisp code, great docs, zero fluff.' },
  { n: 'Daniel Park', r: 'Indie Maker', i: 'DP', c: 'linear-gradient(135deg,#f57c3a,#ff9a5a)', t: 'Bought five products. License delivery is instant and the source is genuinely clean. Worth every dollar.' },
  { n: 'Priya Sharma', r: 'CTO, NimbusOps', i: 'PS', c: 'linear-gradient(135deg,#2bbf95,#4ad3ad)', t: 'We rebuilt our admin panel on top of one of these templates. Way faster than starting from zero.' },
];

const avA = { background: 'linear-gradient(135deg,#1e64ff,#4a8bff)', marginLeft: 0 };
const avB = { background: 'linear-gradient(135deg,#f57c3a,#ff9a5a)' };
const avC = { background: 'linear-gradient(135deg,#2bbf95,#4ad3ad)' };
const avD = { background: 'linear-gradient(135deg,#0b1f4d,#243150)' };
const secAltStyle = { background: 'var(--surface-2)' };
const ctaCenter = { textAlign: 'center', marginTop: 40 };
const tagStyle = { display: 'inline-block', marginBottom: 16 };
