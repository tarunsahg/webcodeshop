'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/Providers';

const ACCENTS = [
  { id: 'webcode', name: 'WebCode Blue', c: 'linear-gradient(135deg,#0b1f4d,#1e64ff)' },
  { id: 'navy', name: 'Deep Navy', c: 'linear-gradient(135deg,#0b1f4d,#243150)' },
  { id: 'orange', name: 'Sunset Orange', c: 'linear-gradient(135deg,#f57c3a,#ff9a5a)' },
  { id: 'teal', name: 'Fresh Teal', c: 'linear-gradient(135deg,#2bbf95,#4ad3ad)' },
  { id: 'sky', name: 'Sky Blue', c: 'linear-gradient(135deg,#0ea5e9,#38bdf8)' },
];

export default function AdminSettings() {
  const app = useApp();
  const [draft, setDraft] = useState(null);
  useEffect(() => { if (app?.settings) setDraft({ dealEnabled: 'on', dealTag: '🎁 Limited time', dealTitle: 'Save 25% on bestsellers', dealCode: 'WCS25', dealBig: '25%', dealSmall: 'OFF', dealCta: 'Shop deals', dealLink: '/shop', ...app.settings }); }, [app?.settings]);
  if (!app || !app.admin || !draft) return null;

  const save = () => app.updateSettings(draft);
  const reset = () => setDraft({ ...app.settings });

  return (
    <>
      <div className="adm-head">
        <div><h1>Home & Style</h1><p className="sub">Live edit your storefront’s hero, accent color, and brand.</p></div>
        <div style={buttonRowStyle}>
          <Link href="/" target="_blank" className="btn btn-soft">Preview ↗</Link>
          <button className="btn btn-ghost" onClick={reset}>Reset</button>
          <button className="btn btn-primary" onClick={save}>Save & publish</button>
        </div>
      </div>
      <div className="card card-pad">
        <div className="set-grid">
          <div className="set-row">
            <label>Brand name<span className="h">Shown in nav, footer, and browser tab.</span></label>
            <input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
          </div>
          <div className="set-row">
            <label>Accent color<span className="h">Used for buttons, links, badges, and gradients throughout the site.</span></label>
            <div className="accent-picker">
              {ACCENTS.map((a) => {
                const sw = { background: a.c };
                return (
                  <div key={a.id} className={'accent-sw' + (draft.accent === a.id ? ' on' : '')} style={sw} onClick={() => { setDraft({ ...draft, accent: a.id }); app.updateSettings({ accent: a.id }); }}>{a.name}</div>
                );
              })}
            </div>
          </div>
          <div className="set-row">
            <label>Eyebrow text<span className="h">Small badge above the hero headline.</span></label>
            <input value={draft.eb} onChange={(e) => setDraft({ ...draft, eb: e.target.value })} />
          </div>
          <div className="set-row">
            <label>Hero headline<span className="h">Use &lt;span class=&quot;gradient-text&quot;&gt;…&lt;/span&gt; to highlight words.</span></label>
            <textarea value={draft.h1} onChange={(e) => setDraft({ ...draft, h1: e.target.value })} />
          </div>
          <div className="set-row">
            <label>Hero subtitle<span className="h">Supporting copy under the headline.</span></label>
            <textarea value={draft.sub} onChange={(e) => setDraft({ ...draft, sub: e.target.value })} />
          </div>
          <div className="set-row">
            <label>Primary CTA<span className="h">Text on the main hero button.</span></label>
            <input value={draft.cta} onChange={(e) => setDraft({ ...draft, cta: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="card card-pad" style={topStyle}>
        <h3 style={hStyle}>Mobile deal banner</h3>
        <p className="muted" style={subSmStyle}>The deal banner now has its own page. <Link href="/admin/deal">Open the Deal banner editor →</Link></p>
      </div>
    </>
  );
}
const buttonRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const topStyle = { marginTop: 22 };
const hStyle = { margin: '0 0 8px', fontSize: 17 };
const subSmStyle = { margin: '0 0 18px', fontSize: 13.5 };
const demoGrid = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 };
const demoBox = { padding: 16, background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' };
const demoLabel = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 };
const demoVal = { fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 };
const toggleLabel = { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600 };
