'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';

const COLORS = [
  { label: 'Blue', c: 'linear-gradient(135deg,#1e64ff,#0b1f4d)' },
  { label: 'Orange', c: 'linear-gradient(135deg,#f57c3a,#ff9a5a)' },
  { label: 'Teal', c: 'linear-gradient(135deg,#2bbf95,#4ad3ad)' },
  { label: 'Purple', c: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { label: 'Pink', c: 'linear-gradient(135deg,#ec4899,#f472b6)' },
  { label: 'Navy', c: 'linear-gradient(135deg,#0b1f4d,#243150)' },
  { label: 'Sky', c: 'linear-gradient(135deg,#0ea5e9,#3b82f6)' },
  { label: 'Amber', c: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
];

function initialsOf(name) {
  const p = String(name || '').trim().split(' ').filter(Boolean);
  return ((((p[0] || '')[0]) || '') + (((p[1] || '')[0]) || '')).toUpperCase() || '?';
}
function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function AdminReviews() {
  const app = useApp();
  const [list, setList] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!app?.settings) return;
    const src = Array.isArray(app.settings.homeReviews) ? app.settings.homeReviews : [];
    setList(src.map((r) => ({
      id: r.id || uid(),
      name: r.name || r.n || '',
      role: r.role || r.r || '',
      quote: r.quote || r.t || '',
      rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
      color: r.color || r.c || COLORS[0].c,
    })));
  }, [app?.settings]);

  if (!app || !app.admin || !list) return null;

  const update = (id, patch) => { setList((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r))); setSaved(false); };
  const add = () => { setList((l) => [...l, { id: uid(), name: '', role: '', quote: '', rating: 5, color: COLORS[l.length % COLORS.length].c }]); setSaved(false); };
  const remove = (id) => { setList((l) => l.filter((r) => r.id !== id)); setSaved(false); };
  const move = (id, dir) => { setSaved(false); setList((l) => {
    const i = l.findIndex((r) => r.id === id);
    if (i < 0) return l;
    const j = i + dir;
    if (j < 0 || j >= l.length) return l;
    const next = l.slice();
    const tmp = next[i]; next[i] = next[j]; next[j] = tmp;
    return next;
  }); };
  const save = async () => {
    setSaving(true);
    const clean = list
      .map((r) => ({ id: r.id, name: (r.name || '').trim(), role: (r.role || '').trim(), quote: (r.quote || '').trim(), rating: r.rating, color: r.color }))
      .filter((r) => r.name || r.quote);
    await app.updateSettings({ homeReviews: clean });
    setSaving(false); setSaved(true);
  };

  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1>Homepage reviews</h1>
          <p className="muted">Add, edit, reorder or remove the testimonials shown in the “From customers we admire” section of your homepage. Changes go live the moment you save.</p>
        </div>
        <div className="rv-head-actions">
          <button className="btn btn-soft" onClick={add}>+ Add review</button>
          <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </header>

      {list.length === 0 && <div className="rv-empty">No reviews yet. Click <b>+ Add review</b> to create your first testimonial.</div>}

      <div className="rv-list">
        {list.map((r, idx) => {
          const avStyle = { background: r.color };
          return (
          <section key={r.id} className="rv-card">
            <div className="rv-card-main">
              <div className="rv-av" style={avStyle}>{initialsOf(r.name)}</div>
              <div className="rv-fields">
                <div className="rv-row2">
                  <div className="field"><label>Name</label><input value={r.name} onChange={(e) => update(r.id, { name: e.target.value })} placeholder="Maya Chen" /></div>
                  <div className="field"><label>Role / company</label><input value={r.role} onChange={(e) => update(r.id, { role: e.target.value })} placeholder="Lead Engineer, Lumio" /></div>
                </div>
                <div className="field"><label>Quote</label><textarea rows={2} value={r.quote} onChange={(e) => update(r.id, { quote: e.target.value })} placeholder="What the customer said…" /></div>
                <div className="rv-row2">
                  <div className="field">
                    <label>Rating</label>
                    <select value={r.rating} onChange={(e) => update(r.id, { rating: Number(e.target.value) })}>
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Avatar color</label>
                    <div className="rv-swatches">
                      {COLORS.map((c) => {
                        const swStyle = { background: c.c };
                        return (
                          <button type="button" key={c.label} title={c.label} onClick={() => update(r.id, { color: c.c })} className={'rv-sw' + (r.color === c.c ? ' on' : '')} style={swStyle} />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rv-card-actions">
              <button className="rv-mv" disabled={idx === 0} onClick={() => move(r.id, -1)} title="Move up">↑</button>
              <button className="rv-mv" disabled={idx === list.length - 1} onClick={() => move(r.id, 1)} title="Move down">↓</button>
              <button className="rv-del" onClick={() => remove(r.id)}>Delete</button>
            </div>
          </section>
          );
        })}
      </div>

      <div className="seo-save-bar">
        <button className="btn btn-soft" onClick={add}>+ Add review</button>
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
        {saved && <span className="seo-saved">✓ Saved — your homepage reviews are live.</span>}
      </div>
    </>
  );
}
