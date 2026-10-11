'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import ProductCard from '@/components/ProductCard';
import { catName } from '@/lib/format';

function GridIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function ListIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }

export default function Shop() {
  const app = useApp();
  const sp = useSearchParams();
  const router = useRouter();
  const [sort, setSort] = useState('popular');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [priceMax, setPriceMax] = useState(8000);
  const [view, setView] = useState('grid');

  useEffect(() => {
    setCat(sp.get('c') || 'all');
    setQ(sp.get('q') || '');
  }, [sp]);

  const products = useMemo(() => {
    if (!app) return [];
    let list = app.products;
    if (cat !== 'all') list = list.filter((p) => p.cat === cat);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.desc || '').toLowerCase().includes(q.toLowerCase()));
    if (priceMax < 8000) list = list.filter((p) => p.price <= priceMax);
    if (sort === 'popular') list = [...list].sort((a, b) => (b.sales || 0) - (a.sales || 0));
    if (sort === 'newest') list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'price-low') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [app, cat, q, sort, priceMax]);

  if (!app) return null;
  const setCatNav = (id) => router.push(id === 'all' ? '/shop' : '/shop?c=' + id);
  const clearAll = () => { setCat('all'); setQ(''); setPriceMax(8000); router.push('/shop'); };
  const hasFilters = cat !== 'all' || q || priceMax < 8000;

  return (
    <>
      <section className="shop-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Home</Link> <span> / </span> <Link href="/shop">Shop</Link>
            {cat !== 'all' && <> <span> / </span> <span>{catName(cat)}</span></>}
          </div>
          <h1>{cat === 'all' ? 'All products' : catName(cat)}</h1>
          <p>Premium code, scripts and digital products — built by indie developers.</p>
        </div>
      </section>

      <div className="shop-v2">
        <aside className="shop-side-v2">
          <h4>Categories</h4>
          <div className="cat-list">
            {[{ id: 'all', name: 'All products', icon: '✨' }, ...(app.categories || [])].map((c) => {
              const n = c.id === 'all' ? app.products.length : app.products.filter((p) => p.cat === c.id).length;
              return (
                <button key={c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCatNav(c.id)}>
                  <span className="ic">{c.image ? <img className="cat-ic-img" src={c.image} alt="" /> : c.icon}</span>
                  <span>{c.name}</span>
                  <span className="n">{n}</span>
                </button>
              );
            })}
          </div>

          <h4>Max price</h4>
          <div style={priceRangeStyle}>
            <input type="range" min="0" max="8000" step="100" value={priceMax} onChange={(e) => setPriceMax(parseInt(e.target.value, 10))} style={priceSliderStyle}/>
            <div style={priceLabelsStyle}>
              <span>₹0</span>
              <span style={priceMaxStyle}>up to {priceMax === 8000 ? '₹8,000+' : '₹' + priceMax.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <h4>Popular tags</h4>
          <div className="tag-cloud">
            <button>Bestseller</button>
            <button>New</button>
            <button>On sale</button>
            <button>4.8+</button>
            <button>Free updates</button>
          </div>
        </aside>

        <main className="shop-main">
          <div className="shop-cat-mobile">
            {[{ id: 'all', name: 'All', icon: '✨' }, ...(app.categories || [])].map((c) => (
              <button key={c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCatNav(c.id)}>
                <span>{c.image ? <img className="cat-ic-img" src={c.image} alt="" /> : c.icon}</span> {c.name}
              </button>
            ))}
          </div>
          <div className="shop-toolbar">
            <div className="ct"><b>{products.length}</b> product{products.length === 1 ? '' : 's'} {q && <>matching <b>“{q}”</b></>}</div>
            <div className="right">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="popular">Most popular</option>
                <option value="newest">Newest first</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Highest rated</option>
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="active-chips">
              {cat !== 'all' && <span className="chip">{catName(cat)}<button onClick={() => setCatNav('all')} aria-label="Remove">×</button></span>}
              {q && <span className="chip">Search: {q}<button onClick={() => { setQ(''); router.push(cat === 'all' ? '/shop' : '/shop?c=' + cat); }} aria-label="Remove">×</button></span>}
              {priceMax < 8000 && <span className="chip">Up to ₹{priceMax.toLocaleString('en-IN')}<button onClick={() => setPriceMax(8000)} aria-label="Remove">×</button></span>}
              <button className="chip-clear" onClick={clearAll}>Clear all</button>
            </div>
          )}

          {products.length === 0 ? (
            <div className="shop-empty">
              <div className="ic">🔍</div>
              <h3>No products match your filters</h3>
              <p className="muted" style={emptyMuted}>Try removing some filters or browse all products.</p>
              <button className="btn btn-primary" onClick={clearAll}>Clear filters</button>
            </div>
          ) : (
            <div className="p-grid">
              {products.map((p) => <ProductCard key={p.id} p={p}/>)}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const priceRangeStyle = { padding: '4px 4px 8px' };
const priceSliderStyle = { width: '100%', accentColor: 'var(--accent)' };
const priceLabelsStyle = { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginTop: 6 };
const priceMaxStyle = { color: 'var(--accent)', fontWeight: 700 };
const emptyMuted = { marginTop: 6, marginBottom: 18 };
