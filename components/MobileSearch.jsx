'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './Providers';
import { money, catName } from '@/lib/format';

export default function MobileSearch() {
  const app = useApp();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const ref = useRef(null);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return (app && app.products ? app.products : []).filter((p) =>
      (p.name || '').toLowerCase().includes(t) ||
      (p.desc || '').toLowerCase().includes(t) ||
      (catName(p.cat) || '').toLowerCase().includes(t)
    ).slice(0, 6);
  }, [q, app && app.products]);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setFocus(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    setFocus(false);
    router.push('/shop?q=' + encodeURIComponent(t));
  };
  const pick = (p) => { setFocus(false); setQ(''); router.push('/product/' + p.id); };

  return (
    <form className="m-search-live" onSubmit={submit} ref={ref} role="search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setFocus(true); }}
        onFocus={() => setFocus(true)}
        placeholder="Search code, scripts & gift cards"
        enterKeyHint="search"
        aria-label="Search products"
      />
      {q && <button type="button" className="m-search-clear" onClick={() => { setQ(''); setFocus(false); }} aria-label="Clear search">×</button>}
      {focus && q.trim() && (
        <div className="m-search-drop">
          {results.length ? results.map((p) => (
            <button type="button" key={p.id} className="m-search-item" onClick={() => pick(p)}>
              <span className="msi-ic">{p.image ? <img src={p.image} alt="" /> : p.icon}</span>
              <span className="msi-info"><b>{p.name}</b><span>{catName(p.cat)} · {money(p.price)}</span></span>
            </button>
          )) : <div className="m-search-empty">No products match “{q.trim()}”</div>}
        </div>
      )}
    </form>
  );
}
