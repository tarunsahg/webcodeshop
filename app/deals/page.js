'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/Providers';
import ProductCard from '@/components/ProductCard';

export default function Deals() {
  const app = useApp();
  const deals = useMemo(() => {
    if (!app) return [];
    const flagged = app.products.filter((p) => p.onDeal);
    const list = flagged.length ? flagged : app.products.filter((p) => p.old && p.old > p.price);
    const pct = (p) => (p.old && p.old > p.price ? (p.old - p.price) / p.old : 0);
    return [...list].sort((a, b) => pct(b) - pct(a));
  }, [app]);

  if (!app) return null;
  const s = app.settings;
  const name = s.dealPageName || 'Deals';
  const dealOn = (s.dealEnabled || 'on') === 'on';

  return (
    <>
      <section className="deals-hero">
        <div className="deals-hero-glow"/>
        <div className="container">
          <div className="crumbs"><Link href="/">Home</Link> <span> / </span> <span>{name}</span></div>
          <span className="deals-pill">{s.dealTag || '🎁 Limited time'}</span>
          <h1>{name}</h1>
          <p>{s.dealTitle || 'Save on bestselling code, scripts & instant gift cards.'}</p>
          {dealOn && s.dealCode && (
            <div className="deals-code">
              <span>Use code <b>{s.dealCode}</b> at checkout</span>
              {s.dealBig && <span className="deals-off">{s.dealBig} {s.dealSmall || 'OFF'}</span>}
            </div>
          )}
        </div>
      </section>

      <div className="container deals-wrap">
        {deals.length === 0 ? (
          <div className="shop-empty">
            <div className="ic">🏷️</div>
            <h3>No deals right now</h3>
            <p className="muted" style={emptyMuted}>Check back soon — or browse the full store in the meantime.</p>
            <Link href="/shop" className="btn btn-primary">Browse all products</Link>
          </div>
        ) : (
          <>
            <div className="deals-bar">
              <div className="deals-count"><b>{deals.length}</b> product{deals.length === 1 ? '' : 's'} on sale right now</div>
              <Link href="/shop" className="deals-alllink">Browse all products →</Link>
            </div>
            <div className="p-grid">{deals.map((p) => <ProductCard key={p.id} p={p}/>)}</div>
          </>
        )}
      </div>
    </>
  );
}
const emptyMuted = { marginTop: 6, marginBottom: 18 };
