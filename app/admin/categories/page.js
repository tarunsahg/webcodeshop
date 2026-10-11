'use client';
import { useState } from 'react';
import { useApp } from '@/components/Providers';
import { normalizeImage } from '@/lib/image-normalize';

const EMOJI_CHOICES = ['📦', '🐘', '🎨', '⚡', '🎁', '🖥️', '📡', '🧩', '🛠️', '📱', '📊', '🔒', '🚀', '🎮', '📚', '🎬'];

export default function AdminCategories() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState('');
  const [sub, setSub] = useState('');
  const [uploading, setUploading] = useState(false);
  if (!app || !app.admin) return null;

  const cats = app.categories || [];
  const countFor = (id) => (app.products || []).filter((p) => p.cat === id).length;

  const openNew = () => { setErr(''); setEditingId(null); setName(''); setIcon('📦'); setImage(''); setSub(''); setOpen(true); };
  const openEdit = (c) => { setErr(''); setEditingId(c.id); setName(c.name || ''); setIcon(c.icon || '📦'); setImage(c.image || ''); setSub(c.sub || ''); setOpen(true); };

  const onPickImage = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUploading(true); setErr('');
    try {
      const normalized = await normalizeImage(f, 800, 800);
      const fd = new FormData();
      fd.append('file', normalized);
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error((data && data.error) || 'Upload failed');
      setImage(data.url);
    } catch (e2) { setErr(e2.message || 'Upload failed'); } finally { setUploading(false); }
  };

  const save = async () => {
    if (!name.trim()) { setErr('Category name is required'); return; }
    setBusy(true);
    const r = editingId ? await app.updateCategory(editingId, { name, icon, image, sub }) : await app.addCategory(name, icon, image, sub);
    setBusy(false);
    if (r && r.ok) { setOpen(false); setEditingId(null); setName(''); setIcon('📦'); setImage(''); setSub(''); }
    else setErr((r && r.error) || 'Could not save category');
  };

  const remove = async (c) => {
    const n = countFor(c.id);
    const msg = n > 0
      ? 'Delete “' + c.name + '”? ' + n + ' product' + (n === 1 ? '' : 's') + ' use this category and will keep their current tag until reassigned.'
      : 'Delete the “' + c.name + '” category?';
    if (confirm(msg)) app.deleteCategory(c.id);
  };

  const modalCardStyle = { maxWidth: 460 };
  const emojiGridStyle = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 };
  const swatchBase = { width: 42, height: 42, borderRadius: 10, fontSize: 20, display: 'grid', placeItems: 'center', cursor: 'pointer', background: 'var(--surface-2)', border: '1px solid var(--border)' };

  return (
    <>
      <header className="adm-page-head">
        <div><h1>Categories</h1><p className="muted">{cats.length} categor{cats.length === 1 ? 'y' : 'ies'} — used to organise your storefront.</p></div>
        <button className="btn btn-primary" onClick={openNew}>+ Add category</button>
      </header>

      <section className="adm-card">
        <table className="adm-table">
          <thead><tr><th>Category</th><th>Slug</th><th>Products</th><th></th></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id}>
                <td><div className="cat-cell">{c.image ? <img className="cat-thumb" src={c.image} alt="" /> : <span className="cat-emoji">{c.icon}</span>}<b>{c.name}</b></div></td>
                <td><span className="key-pill">{c.id}</span></td>
                <td>{countFor(c.id)}</td>
                <td style={actionStyle}>
                  <button className="btn btn-soft btn-sm" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan={4} className="empty-state small">No categories yet. Add your first one.</td></tr>}
          </tbody>
        </table>
      </section>

      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div className="modal-card" style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit category' : 'Add category'}</h2>
            <div className="field">
              <label>Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. WordPress themes" autoFocus />
            </div>
            <div className="field">
              <label>Icon (emoji)</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
              <div style={emojiGridStyle}>
                {EMOJI_CHOICES.map((em) => {
                  const st = icon === em ? { ...swatchBase, borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : swatchBase;
                  return <button type="button" key={em} style={st} onClick={() => setIcon(em)}>{em}</button>;
                })}
              </div>
            </div>
            <div className="field">
              <label>Main image (optional)</label>
              {image ? (
                <div className="cat-img-prev"><img src={image} alt="" /><button type="button" className="btn btn-ghost btn-sm" onClick={() => setImage('')}>Remove</button></div>
              ) : (
                <label className="cat-img-drop">{uploading ? 'Uploading…' : '+ Click to upload image'}<input type="file" accept="image/*" hidden onChange={onPickImage} /></label>
              )}
              <p className="img-hint">Every image is automatically cropped to a locked 1:1 square (800×800) so all categories look perfectly consistent on every device — upload any size you like.</p>
            </div>
            <div className="field">
              <label>Subdescription (optional)</label>
              <textarea rows={2} value={sub} onChange={(e) => setSub(e.target.value)} placeholder="Short tagline shown under the category name, e.g. CMS, eCommerce & admin scripts" />
              <p className="img-hint">A short line shown beneath the category name on the storefront.</p>
            </div>
            {err && <div className="err-banner">{err}</div>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : (editingId ? 'Save changes' : 'Add category')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
const actionStyle = { display: 'flex', gap: 8, justifyContent: 'flex-end' };
