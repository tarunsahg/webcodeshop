'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/Providers';
import ProductCard from '@/components/ProductCard';
import { money, catName } from '@/lib/format';

function ShieldIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z"/></svg>; }
function TruckIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M13 16V3H1v13h12zm0-9h5l4 4v5h-9V7zM5.5 19.5a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"/></svg>; }
function RefreshIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-2.64-6.36M21 4v5h-5"/></svg>; }

export default function ProductPage() {
  const app = useApp();
  const { id } = useParams();
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [sel, setSel] = useState(0);
  if (!app || !app.hydrated) return (
    <div className="container page-loading" style={notFoundStyle}>
      <div className="page-spin" />
      <p className="page-loading-txt">Loading product…</p>
    </div>
  );
  const p = app.products.find((x) => x.id === id);
  if (!p) return (
    <div className="container" style={notFoundStyle}>
      <h2>Product not found</h2>
      <Link href="/shop" className="btn btn-primary">Back to shop</Link>
    </div>
  );
  const related = app.products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const imgStyle = { background: p.gr };
  const imgs = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
  const thumbStyle = { background: p.gr };
  const addCart = () => { app.addToCart(p.id, 1); };
  const buyNow = () => { app.addToCart(p.id, 1); router.push('/checkout'); };
  const savePct = p.old && p.old > p.price ? Math.round(((p.old - p.price) / p.old) * 100) : 0;

  const defaultFeatures = [
    'Production-ready source code',
    'Lifetime updates included',
    'Commercial license',
    'Detailed documentation',
    'Email support for 6 months',
    'Secure, signed download links',
  ];
  const features = (Array.isArray(p.features) && p.features.length) ? p.features : defaultFeatures;
  const defaultSpecs = [
    { label: 'Category', value: catName(p.cat) },
    { label: 'Files included', value: 'Source + docs' },
    { label: 'License', value: 'Commercial' },
    { label: 'Last updated', value: 'This week' },
    { label: 'Compatibility', value: 'Latest stable' },
    { label: 'Support', value: '6 months' },
  ];
  const specs = (Array.isArray(p.specs) && p.specs.length) ? p.specs : defaultSpecs;

  return (
    <div className="container pd-v2">
      <div className="crumb">
        <Link href="/">Home</Link> <span> / </span>
        <Link href={'/shop?c=' + p.cat}>{catName(p.cat)}</Link> <span> / </span>
        <span>{p.name}</span>
      </div>
      <div className="layout">
        <div className="pd-gallery">
          <div className="pd-hero-img" style={imgStyle}>
            {imgs.length ? <img className="pd-hero-photo" src={imgs[sel] || imgs[0]} alt={p.name} /> : <span className="icon">{p.icon}</span>}
          </div>
          {imgs.length > 1 ? (
            <div className="pd-thumbs">
              {imgs.map((src, i) => (
                <div key={src + '_' + i} className={'pd-thumb img' + (i === sel ? ' on' : '')} onClick={() => setSel(i)}>
                  <img src={src} alt={'View ' + (i + 1)} />
                </div>
              ))}
            </div>
          ) : (!imgs.length && (
            <div className="pd-thumbs">
              <div className="pd-thumb on" style={thumbStyle}>{p.icon}</div>
              <div className="pd-thumb" style={thumbStyle}>{p.icon}</div>
              <div className="pd-thumb" style={thumbStyle}>{p.icon}</div>
              <div className="pd-thumb" style={thumbStyle}>{p.icon}</div>
            </div>
          ))}
        </div>

        <div className="pd-right">
          <div className="cat-pill">{catName(p.cat)}</div>
          <h1>{p.name}</h1>
          <div className="meta">
            <span className="stars">{'★'.repeat(Math.round(p.rating || 0))}</span>
            <span>{(p.rating || 0).toFixed(1)}</span>
            <span className="sep"/>
            <span>{(p.sales || 0).toLocaleString()} sold</span>
          </div>
          <div className="price-row">
            <span className="pr">{money(p.price)}</span>
            {p.old > 0 && <span className="old">{money(p.old)}</span>}
            {savePct > 0 && <span className="badge-save">SAVE {savePct}%</span>}
          </div>
          <p className="desc">{p.desc}</p>
          <ul className="pd-feat-list">
            {features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          <div className="pd-buy">
            <div className="pd-buy-actions">
              <button className="btn btn-primary btn-xl" onClick={buyNow}>Buy now →</button>
              <button className="btn btn-outline btn-xl" onClick={addCart}>Add to cart</button>
            </div>
          </div>
          <div className="trust-row">
            <div className="t"><TruckIcon/><div><b>Instant</b><span>Delivery</span></div></div>
            <div className="t"><RefreshIcon/><div><b>Lifetime</b><span>Free updates</span></div></div>
            <div className="t"><ShieldIcon/><div><b>Secure</b><span>{p.kind === 'giftcard' ? 'Gift code' : 'Downloads'}</span></div></div>
          </div>
        </div>
      </div>

      <div className="pd-tabs">
        <div className="pd-tabs-head">
          <button className={tab === 'overview' ? 'on' : ''} onClick={() => setTab('overview')}>Overview</button>
          <button className={tab === 'features' ? 'on' : ''} onClick={() => setTab('features')}>Features</button>
          <button className={tab === 'tech' ? 'on' : ''} onClick={() => setTab('tech')}>Tech specs</button>
        </div>
        <div className="pd-tab-body">
          {tab === 'overview' && (
            <div>
              <p style={tabPara}>{p.desc}</p>
              <p style={tabPara}>This product is built to production standards with clean architecture, comprehensive documentation, and a focus on developer experience. Whether you’re shipping your first SaaS or extending a mature codebase, you can drop this in and trust it works.</p>
              <p style={tabPara}>You get full source code, no obfuscation, no licensing servers — just the files, the docs, and a guarantee that we’ll back you up if something breaks.</p>
            </div>
          )}
          {tab === 'features' && (
            <ul className="pd-feat-list" style={featTabList}>
              {features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          )}
          {tab === 'tech' && (
            <div className="spec-grid">
              {specs.map((s, i) => (
                <div key={i} className="spec"><span className="l">{s.label}</span><span className="v">{s.value}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section style={relatedSec}>
          <div className="sec-head-v2" style={relatedHead}>
            <div className="sec-tag">You may also like</div>
            <h2>Related products</h2>
          </div>
          <div className="p-grid">
            {related.map((r) => <ProductCard key={r.id} p={r}/>)}
          </div>
        </section>
      )}
    </div>
  );
}

const SAMPLE_REVIEWS = [
  { n: 'Alex Reyes', i: 'AR', c: 'linear-gradient(135deg,#1e64ff,#4a8bff)', d: '2 weeks ago', t: 'Genuinely the cleanest code I’ve bought from a marketplace. Shipped a client project on top of this in 3 days.' },
  { n: 'Sofia Klein', i: 'SK', c: 'linear-gradient(135deg,#f57c3a,#ff9a5a)', d: '1 month ago', t: 'Docs are excellent, support replied within an hour. Highly recommend if you value your time.' },
  { n: 'Jordan Lee', i: 'JL', c: 'linear-gradient(135deg,#2bbf95,#4ad3ad)', d: '2 months ago', t: 'Production-ready, well-tested. Saved me weeks. Will buy again.' },
];

const notFoundStyle = { padding: '80px 20px', textAlign: 'center' };
const buyNowStyle = { flex: 1, minWidth: 180 };
const tabPara = { marginBottom: 14 };
const featTabList = { gridTemplateColumns: '1fr 1fr', maxWidth: 720 };
const relatedSec = { paddingTop: 80, marginTop: 40, borderTop: '1px solid var(--border)' };
const relatedHead = { marginBottom: 32, textAlign: 'left' };
const revHeadStyle = { display: 'flex', alignItems: 'center', padding: '20px 0 28px', borderBottom: '1px solid var(--border)', marginBottom: 24 };
const revBigRating = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' };
const revNumStyle = { fontSize: 48, fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.03em' };
const revStarsStyle = { color: 'var(--yellow)', letterSpacing: 2, fontSize: 16, marginTop: 8 };
const revCountStyle = { fontSize: 13, color: 'var(--muted)', marginTop: 6 };
const revListStyle = { display: 'flex', flexDirection: 'column', gap: 16 };
const revCardStyle = { padding: 20, background: '#fff', border: '1px solid var(--border)', borderRadius: 14 };
const revRowStyle = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 };
const revAuthStyle = { fontWeight: 700, fontSize: 14, color: 'var(--text)' };
const revAuthStarsStyle = { color: 'var(--yellow)', letterSpacing: 1, fontSize: 12, marginTop: 2 };
const revDateStyle = { marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted)' };
const revBodyStyle = { fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 };
