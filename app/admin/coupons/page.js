'use client';
import { useState } from 'react';
import { useApp } from '@/components/Providers';

export default function AdminCoupons() {
  const app = useApp();
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  if (!app || !app.admin) return null;

  const newCp = () => { setErr(''); setEditing({ code: '', type: 'percent', value: 10, active: true, isNew: true }); };
  const edit = (c) => { setErr(''); setEditing({ ...c }); };

  const save = async () => {
    if (!editing.code || editing.value == null || editing.value === '') { setErr('Code and value are required'); return; }
    if (Number(editing.value) <= 0) { setErr('Value must be greater than 0'); return; }
    const payload = editing.isNew
      ? { code: editing.code.toUpperCase().trim(), type: editing.type, value: Number(editing.value), active: !!editing.active }
      : { id: editing.id, type: editing.type, value: Number(editing.value), active: !!editing.active };
    const r = await app.saveCoupon(payload);
    if (r && r.ok) setEditing(null); else setErr((r && r.error) || 'Save failed');
  };

  const remove = (id) => { if (confirm('Delete this coupon?')) app.deleteCoupon(id); };

  return (
    <>
      <header className="adm-page-head">
        <div><h1>Coupons</h1><p className="muted">{app.coupons.length} coupons — {app.coupons.filter((c) => c.active).length} active.</p></div>
        <button className="btn btn-primary" onClick={newCp}>+ Create coupon</button>
      </header>
      <section className="adm-card">
        <table className="adm-table">
          <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {app.coupons.map((c) => (
              <tr key={c.id}>
                <td><span className="key-pill">{c.code}</span></td>
                <td><b>{c.type === 'percent' ? c.value + '%' : '₹' + c.value}</b> <span className="muted">off</span></td>
                <td>{c.uses || 0} time{(c.uses || 0) === 1 ? '' : 's'}</td>
                <td><span className={'status-pill ' + (c.active ? 'completed' : 'failed')}>{c.active ? 'active' : 'paused'}</span></td>
                <td style={actionStyle}>
                  <button className="btn btn-soft btn-sm" onClick={() => edit(c)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => app.toggleCoupon(c.id)}>{c.active ? 'Pause' : 'Activate'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {app.coupons.length === 0 && <tr><td colSpan={5} className="empty-state small">No coupons yet — create your first one.</td></tr>}
          </tbody>
        </table>
      </section>
      {editing && (
        <div className="modal" onClick={() => setEditing(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editing.isNew ? 'Create coupon' : 'Edit coupon'}</h2>
            <div className="field"><label>Coupon code</label><input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="SUMMER10" disabled={!editing.isNew} /></div>
            <div className="row2">
              <div className="field"><label>Discount type</label>
                <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  <option value="percent">Percentage</option><option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div className="field"><label>Value ({editing.type === 'percent' ? '%' : '$'})</label><input type="number" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} /></div>
            </div>
            <label className="chk"><input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })}/> Active</label>
            {err && <div className="err-banner">{err}</div>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
const actionStyle = { display: 'flex', gap: 8, justifyContent: 'flex-end' };
