'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/components/Providers';
import { money, catName } from '@/lib/format';
import { normalizeImage } from '@/lib/image-normalize';

const GRADIENTS = [
  'linear-gradient(135deg,#0b1f4d,#1e64ff)',
  'linear-gradient(135deg,#1e64ff,#4a8bff)',
  'linear-gradient(135deg,#f57c3a,#ff9a5a)',
  'linear-gradient(135deg,#2bbf95,#4ad3ad)',
  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#1e3a8a,#3b82f6)',
];

export default function AdminProducts() {
  const app = useApp();
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState('createdAt_desc');
  const [err, setErr] = useState('');
  if (!app || !app.admin) return null;

  const products = useMemo(() => {
    let arr = [...(app.products || [])];
    if (cat !== 'all') arr = arr.filter((p) => p.cat === cat);
    const t = q.trim().toLowerCase();
    if (t) arr = arr.filter((p) => (p.name || '').toLowerCase().includes(t) || (p.desc || '').toLowerCase().includes(t));
    const [key, dir] = sort.split('_');
    arr.sort((a, b) => {
      const av = a[key]; const bv = b[key];
      if (typeof av === 'string') return dir === 'desc' ? String(bv).localeCompare(av) : String(av).localeCompare(bv);
      return dir === 'desc' ? (bv || 0) - (av || 0) : (av || 0) - (bv || 0);
    });
    return arr;
  }, [app.products, q, cat, sort]);

  const newProduct = () => { setErr(''); setEditing({ id: '', name: '', cat: 'php', price: 29, old: 0, icon: '\ud83d\udce6', image: '', images: [], gr: GRADIENTS[0], desc: '', tag: '', tagType: '', rating: 4.8, reviews: 0, sales: 0, features: [], specs: [], trending: false, newArrival: false, onDeal: false, kind: 'code', fileUrl: '', fileName: '', isNew: true }); };
  const edit = (p) => { setErr(''); setEditing({ ...p, images: (Array.isArray(p.images) && p.images.length) ? p.images : (p.image ? [p.image] : []), features: Array.isArray(p.features) ? p.features : [], specs: Array.isArray(p.specs) ? p.specs : [] }); };
  const remove = (id) => { if (confirm('Delete this product?')) app.deleteProduct(id); };

  const uploadImage = async (file) => {
    if (!file) return;
    if (((editing && editing.images) || []).length >= 5) { setErr('You can upload up to 5 images per product'); return; }
    setErr('');
    setUploading(true);
    try {
      const normalized = await normalizeImage(file, 1200, 900);
      const fd = new FormData();
      fd.append('file', normalized);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error((data && data.error) || 'Upload failed');
      setEditing((prev) => { const imgs = [...((prev && prev.images) || []), data.url].slice(0, 5); return { ...prev, images: imgs, image: imgs[0] }; });
    } catch (e) {
      setErr(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => setEditing((prev) => { const imgs = ((prev && prev.images) || []).filter((_, i) => i !== idx); return { ...prev, images: imgs, image: imgs[0] || '' }; });

  const uploadProductFile = async (file) => {
    if (!file) return;
    setErr('');
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/product-file', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error((data && data.error) || 'Upload failed');
      setEditing((prev) => ({ ...prev, fileUrl: data.url, fileName: data.name }));
    } catch (e) {
      setErr(e.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };
  const clearProductFile = () => setEditing((prev) => ({ ...prev, fileUrl: '', fileName: '' }));
  const orStyle = { marginTop: 8 };

  const setFeature = (i, val) => setEditing((prev) => { const f = [...((prev && prev.features) || [])]; f[i] = val; return { ...prev, features: f }; });
  const addFeature = () => setEditing((prev) => ({ ...prev, features: [...((prev && prev.features) || []), ''] }));
  const removeFeature = (i) => setEditing((prev) => ({ ...prev, features: ((prev && prev.features) || []).filter((_, idx) => idx !== i) }));
  const setSpec = (i, key, val) => setEditing((prev) => { const s = [...((prev && prev.specs) || [])]; s[i] = { ...(s[i] || { label: '', value: '' }), [key]: val }; return { ...prev, specs: s }; });
  const addSpec = () => setEditing((prev) => ({ ...prev, specs: [...((prev && prev.specs) || []), { label: '', value: '' }] }));
  const removeSpec = (i) => setEditing((prev) => ({ ...prev, specs: ((prev && prev.specs) || []).filter((_, idx) => idx !== i) }));

  const previewStyle = editing ? { background: editing.image ? '#fff' : editing.gr } : {};

  const save = async () => {
    if (!editing.name || !editing.name.trim()) { setErr('Name is required'); return; }
    if (!editing.price || Number(editing.price) <= 0) { setErr('Price must be greater than 0'); return; }
    const payload = {
      ...editing,
      name: editing.name.trim(),
      price: Number(editing.price),
      old: Number(editing.old) || 0,
      rating: Number(editing.rating) || 0,
      reviews: Number(editing.reviews) || 0,
      sales: Number(editing.sales) || 0,
    };
    if (editing.isNew) delete payload.id;
    delete payload.isNew;
    const r = await app.saveProduct(payload);
    if (r && r.ok) setEditing(null); else setErr((r && r.error) || 'Save failed');
  };

  return (
    <>
      <header className="adm-page-head">
        <div><h1>Products</h1><p className="muted">{(app.products || []).length} products in your catalog.</p></div>
        <button className="btn btn-primary" onClick={newProduct}>+ Add product</button>
      </header>
      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="adm-select">
            <option value="all">All categories</option>
            {(app.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="adm-select">
            <option value="createdAt_desc">Newest first</option>
            <option value="name_asc">Name (A–Z)</option>
            <option value="price_desc">Price (high to low)</option>
            <option value="price_asc">Price (low to high)</option>
            <option value="sales_desc">Most sold</option>
          </select>
        </div>
        <table className="adm-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Sales</th><th>Rating</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => {
              const iconStyle = { background: p.gr };
              return (
                <tr key={p.id}>
                  <td><div className="prod-cell"><div className="prod-icon" style={iconStyle}>{p.image ? <img src={p.image} alt={p.name} /> : p.icon}</div><div className="prod-meta"><b>{p.name}</b><span className="muted">{(p.desc || '').slice(0, 60)}{(p.desc || '').length > 60 ? '…' : ''}</span></div></div></td>
                  <td><span className="cat-pill">{catName(p.cat)}</span>{p.kind === 'giftcard' && <span className="type-pill gift">🎁 Gift card</span>}</td>
                  <td><b>{money(p.price)}</b>{p.old > 0 && <div className="muted strike">{money(p.old)}</div>}</td>
                  <td>{p.sales || 0}</td>
                  <td>★ {p.rating || 0} <span className="muted">({p.reviews || 0})</span></td>
                  <td style={actionStyle}>
                    <button className="btn btn-soft btn-sm" onClick={() => edit(p)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && <tr><td colSpan={6} className="empty-state small">No products match.</td></tr>}
          </tbody>
        </table>
      </section>

      {editing && (
        <div className="modal" onClick={() => setEditing(null)}>
          <div className="modal-card lg" onClick={(e) => e.stopPropagation()}>
            <h2>{editing.isNew ? 'Add product' : 'Edit product'}</h2>
            <div className="row2">
              <div className="field"><label>Name *</label><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="React Dashboard Pro" /></div>
              <div className="field"><label>Category</label>
                <select value={editing.cat} onChange={(e) => setEditing({ ...editing, cat: e.target.value })}>
                  {(app.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Product type</label>
              <div className="ptype-row">
                <label className={'ptype' + (editing.kind !== 'giftcard' ? ' on' : '')}>
                  <input type="radio" name="ptype" checked={editing.kind !== 'giftcard'} onChange={() => setEditing({ ...editing, kind: 'code' })} />
                  <span className="ptype-ic">💻</span>
                  <span className="ptype-t"><b>Code / Source code</b><small>Delivered as a license key + secure download link.</small></span>
                </label>
                <label className={'ptype' + (editing.kind === 'giftcard' ? ' on' : '')}>
                  <input type="radio" name="ptype" checked={editing.kind === 'giftcard'} onChange={() => setEditing({ ...editing, kind: 'giftcard' })} />
                  <span className="ptype-ic">🎁</span>
                  <span className="ptype-t"><b>Gift card</b><small>Delivered as a redeemable gift code + PIN. No file download.</small></span>
                </label>
              </div>
            </div>
            <div className="row3">
              <div className="field"><label>Price (₹) *</label><input type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></div>
              <div className="field"><label>Compare-at (₹)</label><input type="number" step="0.01" value={editing.old} onChange={(e) => setEditing({ ...editing, old: e.target.value })} /></div>
              <div className="field"><label>Icon (emoji)</label><input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} maxLength={4} /></div>
            </div>
            <div className="field">
              <label>Product images <span className="muted">· up to 5</span></label>
              <div className="img-multi">
                {(editing.images || []).map((src, i) => {
                  const k = src + '_' + i;
                  return (
                    <div key={k} className="img-multi-item">
                      <img src={src} alt={'Image ' + (i + 1)} />
                      {i === 0 && <span className="img-multi-main">Main</span>}
                      <button type="button" className="img-multi-del" onClick={() => removeImage(i)} aria-label="Remove image">×</button>
                    </div>
                  );
                })}
                {(editing.images || []).length < 5 && (
                  <label className="img-multi-add">
                    <span>{uploading ? '…' : '+'}</span>
                    <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => uploadImage(e.target.files && e.target.files[0])} />
                  </label>
                )}
              </div>
              <span className="img-hint">The first image is the main thumbnail. Every image is automatically cropped to a locked 4:3 size (1200×900) so all products look perfectly consistent on every device — upload any size you like. PNG, JPG, WEBP or SVG · up to 5 MB each · max 5 images.</span>
            </div>
            {editing.kind !== 'giftcard' && (
              <div className="field">
                <label>Downloadable file <span className="muted">· this link is shared with buyers</span></label>
                {editing.fileUrl ? (
                  <div className="file-attached">
                    <span className="file-ic">📄</span>
                    <div className="file-meta"><b>{editing.fileName || 'Attached file'}</b><span className="muted">{(editing.fileUrl || '').startsWith('/') ? ((typeof window !== 'undefined' ? window.location.origin : '') + editing.fileUrl) : editing.fileUrl}</span></div>
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => { const u = editing.fileUrl || ''; const full = u.startsWith('/') ? (window.location.origin + u) : u; navigator.clipboard.writeText(full); app.showToast('File link copied — share it with your customer', 'success'); }}>Copy link</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={clearProductFile}>Remove</button>
                  </div>
                ) : (
                  <>
                    <label className="file-drop">
                      <span>{uploadingFile ? 'Uploading…' : '⬆ Upload file (ZIP, PHP, HTML, PDF, JS…)'}</span>
                      <input type="file" hidden disabled={uploadingFile} onChange={(e) => uploadProductFile(e.target.files && e.target.files[0])} />
                    </label>
                    <input style={orStyle} placeholder="…or paste a direct file link (https://…)" value={editing.fileUrl || ''} onChange={(e) => setEditing({ ...editing, fileUrl: e.target.value, fileName: editing.fileName || 'External file' })} />
                  </>
                )}
                <span className="img-hint">Buyers of this code/script get this file as their download. Upload a file or paste a link, then use “Copy link” to share it. Gift cards never get a file.</span>
              </div>
            )}
            <div className="field"><label>Description</label><textarea rows={3} value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} placeholder="Short product description shown on the storefront." /></div>
            <div className="field">
              <label>Key features <span className="muted">· shown on the product page</span></label>
              <div className="kv-list">
                {(editing.features || []).map((f, i) => (
                  <div key={i} className="kv-row">
                    <input value={f} onChange={(e) => setFeature(i, e.target.value)} placeholder={'Feature ' + (i + 1)} />
                    <button type="button" className="kv-del" onClick={() => removeFeature(i)} aria-label="Remove feature">×</button>
                  </div>
                ))}
                {(editing.features || []).length === 0 && <p className="kv-empty">No features yet — add highlights buyers will see.</p>}
              </div>
              <button type="button" className="btn btn-soft btn-sm kv-add" onClick={addFeature}>+ Add feature</button>
            </div>
            <div className="field">
              <label>Technical specs <span className="muted">· label &amp; value pairs</span></label>
              <div className="kv-list">
                {(editing.specs || []).map((s, i) => (
                  <div key={i} className="kv-row spec">
                    <input value={(s && s.label) || ''} onChange={(e) => setSpec(i, 'label', e.target.value)} placeholder="Label (e.g. Framework)" />
                    <input value={(s && s.value) || ''} onChange={(e) => setSpec(i, 'value', e.target.value)} placeholder="Value (e.g. Next.js 14)" />
                    <button type="button" className="kv-del" onClick={() => removeSpec(i)} aria-label="Remove spec">×</button>
                  </div>
                ))}
                {(editing.specs || []).length === 0 && <p className="kv-empty">No specs yet — add details like framework, license, files included.</p>}
              </div>
              <button type="button" className="btn btn-soft btn-sm kv-add" onClick={addSpec}>+ Add spec</button>
            </div>
            <div className="row2">
              <div className="field"><label>Badge text (optional)</label><input value={editing.tag} onChange={(e) => setEditing({ ...editing, tag: e.target.value })} placeholder="BESTSELLER" /></div>
              <div className="field"><label>Badge style</label>
                <select value={editing.tagType} onChange={(e) => setEditing({ ...editing, tagType: e.target.value })}>
                  <option value="">None</option><option value="hot">Hot</option><option value="new">New</option><option value="sale">Sale</option><option value="pro">Pro</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Storefront placement <span className="muted">· pick where this product appears across the storefront</span></label>
              <div className="toggle-row">
                <label className="tgl"><input type="checkbox" checked={!!editing.trending} onChange={(e) => setEditing({ ...editing, trending: e.target.checked })} /> <span>Show in <b>Trending now</b></span></label>
                <label className="tgl"><input type="checkbox" checked={!!editing.newArrival} onChange={(e) => setEditing({ ...editing, newArrival: e.target.checked })} /> <span>Show in <b>New arrivals</b></span></label>
                <label className="tgl"><input type="checkbox" checked={!!editing.onDeal} onChange={(e) => setEditing({ ...editing, onDeal: e.target.checked })} /> <span>Show in <b>Deals page</b></span></label>
              </div>
            </div>
            <div className="field"><label>Icon background gradient</label>
              <div className="grad-picker">
                {GRADIENTS.map((g) => {
                  const sw = { background: g };
                  return <button key={g} type="button" className={'sw' + (editing.gr === g ? ' on' : '')} style={sw} onClick={() => setEditing({ ...editing, gr: g })} />;
                })}
              </div>
            </div>
            {err && <div className="err-banner">{err}</div>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editing.isNew ? 'Create product' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
const actionStyle = { display: 'flex', gap: 8, justifyContent: 'flex-end' };
