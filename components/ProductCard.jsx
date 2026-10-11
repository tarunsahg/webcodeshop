'use client';
import Link from 'next/link';
import { useApp } from './Providers';
import { money, catName } from '@/lib/format';

function HeartIcon({ filled }) { return <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; }

export default function ProductCard({ p }) {
  const app = useApp();
  const onHeart = (e) => { e.preventDefault(); e.stopPropagation(); app.toggleWishlist(p.id); };
  const isLiked = app.inWishlist && app.inWishlist(p.id);
  const thumbStyle = { background: p.gr };
  const savePct = p.old && p.old > p.price ? Math.round(((p.old - p.price) / p.old) * 100) : 0;
  return (
    <Link href={'/product/' + p.id} className="p-card-v2">
      <div className="thumb" style={thumbStyle}>
        {p.image ? <img className="thumb-img" src={p.image} alt={p.name} loading="lazy" /> : <span className="icn">{p.icon}</span>}
        {p.tag && <span className={'tag ' + (p.tagType || '')}>{p.tag}</span>}
        <button type="button" className={'wishlist-heart' + (isLiked ? ' active' : '')} onClick={onHeart} aria-label={isLiked ? 'Remove from wishlist' : 'Save to wishlist'}>
          <HeartIcon filled={isLiked} />
        </button>
      </div>
      <div className="body">
        <div className="cat">{catName(p.cat)}</div>
        <div className="nm">{p.name}</div>
        <div className="row">
          <span className="stars">{'★'.repeat(Math.round(p.rating || 0))}</span>
          <span>{(p.rating || 0).toFixed(1)}</span>
          <span className="sales">{(p.sales || 0).toLocaleString()} sold</span>
        </div>
        <div className="foot">
          <span className="price">{money(p.price)}</span>
          {p.old > 0 && p.old > p.price && <span className="old">{money(p.old)}</span>}
          {savePct > 0 && <span className="save">SAVE {savePct}%</span>}
        </div>
      </div>
    </Link>
  );
}
