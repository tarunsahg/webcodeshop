'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const app = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!app || !app.authReady) return;
    if (!app.user) router.replace('/login?next=/wishlist');
  }, [app, router]);

  if (!app || !app.authReady) return <main className="container" style={pageStyle}><p className="muted">Loading…</p></main>;
  if (!app.user) return null;
  const items = (app.products || []).filter(p => app.wishlistIds && app.wishlistIds.includes(p.id));

  return (
    <main className="container wl-page" style={pageStyle}>
      <div className="wl-hero">
        <Link href="/account" className="crumb">← Back to account</Link>
        <div className="wl-hero-row">
          <div>
            <h1>Your wishlist</h1>
            <p className="muted">{items.length} item{items.length === 1 ? '' : 's'} saved for later.</p>
          </div>
          {items.length > 0 && <Link href="/shop" className="btn btn-soft wl-browse">Browse more →</Link>}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="wl-empty">
          <div className="wl-empty-ico">♡</div>
          <h3>Nothing saved yet</h3>
          <p>Tap the heart on any product to save it here for later.</p>
          <Link href="/shop" className="btn btn-primary">Browse products</Link>
        </div>
      ) : (
        <div className="p-grid">
          {items.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}

const pageStyle = { padding: '32px 16px 80px' };
