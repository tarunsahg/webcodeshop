'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/components/Providers';
import { money } from '@/lib/format';

export default function AdminCustomers() {
  const app = useApp();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('spent_desc');
  const [editing, setEditing] = useState(null);
  const [eName, setEName] = useState('');
  const [ePass, setEPass] = useState('');
  const [saving, setSaving] = useState(false);
  if (!app || !app.admin) return null;

  const openEdit = (c) => { setEditing(c); setEName(c.name || ''); setEPass(''); };
  const saveEdit = async () => {
    if (!editing) return;
    const patch = {};
    if (eName.trim() && eName.trim() !== editing.name) patch.name = eName.trim();
    if (ePass) patch.password = ePass;
    if (!patch.name && !patch.password) { app.showToast('Enter a new name or password', 'error'); return; }
    if (patch.password && patch.password.length < 6) { app.showToast('Password must be at least 6 characters', 'error'); return; }
    setSaving(true);
    const r = await app.updateCustomer(editing.id, patch);
    setSaving(false);
    if (r && r.ok) setEditing(null);
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let arr = (app.customers || []).map((c) => ({
      id: c.id, name: c.name, email: c.email,
      orders: c.orders || 0, spent: c.spent || 0,
      joined: (c.created_at || '').slice(0, 10),
    }));
    if (t) arr = arr.filter((c) => c.name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t));
    const [key, dir] = sort.split('_');
    arr.sort((a, b) => {
      const av = a[key]; const bv = b[key];
      if (typeof av === 'string') return dir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
      return dir === 'desc' ? bv - av : av - bv;
    });
    return arr;
  }, [app.customers, q, sort]);

  return (
    <>
      <header className="adm-page-head">
        <div><h1>Customers</h1><p className="muted">{(app.customers || []).length} registered customers.</p></div>
      </header>
      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="adm-select">
            <option value="spent_desc">Spend (high to low)</option>
            <option value="spent_asc">Spend (low to high)</option>
            <option value="orders_desc">Orders (most first)</option>
            <option value="name_asc">Name (A–Z)</option>
            <option value="joined_desc">Newest first</option>
          </select>
        </div>
        <table className="adm-table">
          <thead><tr><th>Customer</th><th>Email</th><th>Orders</th><th>Spent</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {filtered.map((c) => {
              const initials = (c.name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
              const avStyle = { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1e64ff,#0b1f4d)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 };
              const rowStyle = { display: 'flex', alignItems: 'center', gap: 12 };
              return (
                <tr key={c.id}>
                  <td><div style={rowStyle}><div style={avStyle}>{initials}</div><b>{c.name}</b></div></td>
                  <td className="muted">{c.email}</td>
                  <td>{c.orders}</td>
                  <td><b>{money(c.spent)}</b></td>
                  <td className="muted">{c.joined || '—'}</td>
                  <td style={actionsCell}>
                    <button className="btn btn-soft btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm('Delete customer ' + c.email + '?')) app.deleteCustomer(c.id); }}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="empty-state small">No customers found.</td></tr>}
          </tbody>
        </table>
      </section>

      {editing && (
        <div className="modal" onClick={() => setEditing(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><h2>Edit customer</h2><p className="muted">{editing.email}</p></div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Close</button>
            </div>
            <div className="field"><label>Full name</label><input value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Customer name" /></div>
            <div className="field"><label>New password</label><input type="text" value={ePass} onChange={(e) => setEPass(e.target.value)} placeholder="Leave blank to keep current password" /><p style={hintStyle}>Minimum 6 characters. The customer can sign in with this new password right away.</p></div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
const actionsCell = { textAlign: 'right', whiteSpace: 'nowrap' };
const hintStyle = { fontSize: 12, color: 'var(--muted)', marginTop: 6 };
