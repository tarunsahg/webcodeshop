'use client';
import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { money, fmtDate } from '@/lib/format';

const STATUSES = ['all', 'completed', 'pending', 'failed'];

export default function AdminOrders() {
  const app = useApp();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState(null);
  const [msg, setMsg] = useState('');
  const [keyVal, setKeyVal] = useState('');
  const [keyName, setKeyName] = useState('');
  const [keyPin, setKeyPin] = useState('');
  const [customPid, setCustomPid] = useState('');
  useEffect(() => { setMsg(viewing && viewing.adminMessage ? viewing.adminMessage : ''); setKeyVal(''); setKeyName(''); setKeyPin(''); setCustomPid(''); }, [viewing]);
  if (!app || !app.admin) return null;

  const orders = useMemo(() => {
    let arr = app.orders;
    if (filter !== 'all') arr = arr.filter((o) => o.status === filter);
    const t = q.trim().toLowerCase();
    if (t) arr = arr.filter((o) => o.id.toLowerCase().includes(t) || (o.name || '').toLowerCase().includes(t) || (o.email || '').toLowerCase().includes(t));
    return arr;
  }, [app.orders, filter, q]);

  const counts = useMemo(() => {
    const c = { all: app.orders.length };
    for (const s of STATUSES.slice(1)) c[s] = app.orders.filter((o) => o.status === s).length;
    return c;
  }, [app.orders]);

  const selItem = viewing ? (viewing.items || []).find((x) => String(x.pid) === String(customPid)) : null;
  const selKind = selItem && selItem.kind === 'giftcard' ? 'giftcard' : 'code';

  return (
    <>
      <header className="adm-page-head">
        <div><h1>Orders</h1><p className="muted">{app.orders.length} total orders — {counts.completed || 0} completed.</p></div>
      </header>
      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="status-tabs">
            {STATUSES.map((s) => (
              <button key={s} className={'status-tab' + (filter === s ? ' on' : '')} onClick={() => setFilter(s)}>
                {s === 'all' ? 'All' : s} <span className="n">{counts[s] || 0}</span>
              </button>
            ))}
          </div>
          <div className="adm-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order ID, customer…" />
          </div>
        </div>
        <table className="adm-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><b>{o.id}</b></td>
                <td><div className="cell-stack"><b>{o.name}</b><span className="muted">{o.email}</span>{o.phone && <span className="muted">{o.phone}</span>}</div></td>
                <td>{(o.items || []).length} item{(o.items || []).length === 1 ? '' : 's'}</td>
                <td><b>{money(o.total)}</b></td>
                <td>
                  <select value={o.status} onChange={(e) => app.setOrderStatus(o.id, e.target.value)} className={'status-select status-pill ' + o.status}>
                    <option value="completed">completed</option>
                    <option value="pending">pending</option>
                    <option value="failed">failed</option>
                  </select>
                </td>
                <td className="muted">{fmtDate(o.date)}</td>
                <td style={actionStyle}>{o.status === 'pending' && <span className="ord-need-badge">Needs review</span>}<button className="btn btn-primary btn-sm" onClick={() => setViewing(o)}>Manage</button></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="empty-state small">No matching orders.</td></tr>}
          </tbody>
        </table>
      </section>

      {viewing && (
        <div className="modal" onClick={() => setViewing(null)}>
          <div className="modal-card lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><h2>{viewing.id}</h2><p className="muted">{fmtDate(viewing.date)} • <span className={'status-pill ' + viewing.status}>{viewing.status}</span></p></div>
              <div className="ord-head-actions">
                <button className="btn btn-ghost btn-sm ord-del-btn" onClick={async () => { if (confirm('Delete order ' + viewing.id + '? This cannot be undone.')) { await app.deleteOrder(viewing.id); setViewing(null); } }}>Delete order</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewing(null)}>Close</button>
              </div>
            </div>
            <div className="order-detail">
              <div>
                <h4>Customer</h4>
                <p><b>{viewing.name}</b><br/><span className="muted">{viewing.email}</span>{viewing.phone && <><br/><span className="muted">{viewing.phone}</span></>}</p>
              </div>
              <div>
                <h4>Totals</h4>
                <div className="row"><span>Subtotal</span><span>{money(viewing.subtotal || viewing.total)}</span></div>
                {viewing.discount > 0 && <div className="row discount"><span>Discount {viewing.coupon ? '(' + viewing.coupon + ')' : ''}</span><span>−{money(viewing.discount)}</span></div>}
                <div className="row tot"><span>Total</span><span>{money(viewing.total)}</span></div>
              </div>
            </div>
            <div className="ord-payment">
              <div className="ord-pay-info">
                <h4>Payment</h4>
                <p><b>{(viewing.paymentMethod || 'card').toUpperCase()}</b>{viewing.txnId ? <span className="muted"> · Txn ID: {viewing.txnId}</span> : null}</p>
              </div>
            </div>
            <div className="ord-msg">
              <h4>Message to customer</h4>
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a note the customer will see on their order…" />
              <div className="ord-msg-actions">
                <button className="btn btn-primary btn-sm" onClick={async () => { const r = await app.sendOrderMessage(viewing.id, msg); if (r.ok && r.order) setViewing(r.order); }}>Send message</button>
                {viewing.adminMessage ? <span className="sent-tag">✓ Sent to customer</span> : null}
              </div>
            </div>
            <div className="ord-key-add">
              <h4>Payment &amp; fulfilment</h4>
              {viewing.status === 'pending' && (
                <div className="ord-approve-row">
                  <div className="ord-approve-txt"><b>Has the payment been received?</b><span>Approve to confirm payment and mark the order completed. If it was not received, reject it — the order automatically shows as <b>Failed</b> on the customer’s Track Order page.</span></div>
                  <div className="ord-approve-btns">
                    <button className="btn btn-primary btn-sm" onClick={async () => { const r = await app.setOrderStatus(viewing.id, 'completed'); if (r.ok && r.order) setViewing(r.order); }}>✓ Approve — payment received</button>
                    <button className="btn btn-danger btn-sm" onClick={async () => { const r = await app.setOrderStatus(viewing.id, 'failed'); if (r.ok && r.order) setViewing(r.order); }}>✕ Reject — not received</button>
                  </div>
                </div>
              )}
              {viewing.status === 'completed' && (
                <div className="ord-status-note ok">
                  <div><b>✓ Payment approved</b><span>Deliver the download / code below.</span></div>
                </div>
              )}
              {viewing.status === 'failed' && (
                <div className="ord-status-note failed">
                  <div><b>✕ Payment not received</b><span>This order is marked failed and shows as Failed on the customer’s Track Order page. Approve it if the payment actually arrived.</span></div>
                  <button className="btn btn-primary btn-sm" onClick={async () => { const r = await app.setOrderStatus(viewing.id, 'completed'); if (r.ok && r.order) setViewing(r.order); }}>Approve now</button>
                </div>
              )}
              {viewing.status === 'completed' && (
                <>
                  <label className="ord-key-lbl">Deliver downloads &amp; codes per item</label>
                  <div className="ord-deliver-list">
                    {(viewing.items || []).map((it, i) => {
                      const isGift = it.kind === 'giftcard';
                      const delivered = (viewing.keys || []).filter((k) => String(k.pid) === String(it.pid)).length;
                      return (
                        <div key={i} className="ord-deliver-item">
                          <div className="odi-info">
                            <span className={'type-pill ' + (isGift ? 'gift' : 'code')}>{isGift ? '\uD83C\uDF81 Gift card' : '\uD83D\uDCBB Code'}</span>
                            <div className="odi-meta"><b>{it.name}</b><span className="muted">Qty {it.qty} · {delivered} delivered{!isGift ? ' · download link' : ''}</span></div>
                          </div>
                          <button className="btn btn-primary btn-sm" onClick={async () => { const r = await app.addOrderKey(viewing.id, { autoItem: { productId: it.pid, productName: it.name, kind: it.kind, value: isGift ? it.price : null, fileUrl: it.fileUrl || '' } }); if (r.ok && r.order) setViewing(r.order); }}>{isGift ? '🎁 Generate gift code' : '📦 Deliver download'}</button>
                        </div>
                      );
                    })}
                    {(viewing.items || []).length === 0 && <p className="muted">No items on this order.</p>}
                  </div>
                  <label className="ord-key-lbl" style={hStyle}>Or deliver a custom link / code</label>
                  <div className="ord-key-row">
                    <select value={customPid} onChange={(e) => { const v = e.target.value; setCustomPid(v); const it = (viewing.items || []).find((x) => String(x.pid) === String(v)); if (it) setKeyName(it.name); }}>
                      <option value="">No product (generic)</option>
                      {(viewing.items || []).map((it, i) => (<option key={i} value={it.pid}>{it.name}{it.kind === 'giftcard' ? ' (gift)' : ''}</option>))}
                    </select>
                    <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Label (e.g. Amazon Gift Card)" />
                    <input value={keyVal} onChange={(e) => setKeyVal(e.target.value)} placeholder={selKind === 'giftcard' ? 'Enter gift code' : 'Paste download link (https://…)'} />
                    <input value={keyPin} onChange={(e) => setKeyPin(e.target.value)} placeholder="PIN (optional)" />
                    <button className="btn btn-primary btn-sm" onClick={async () => { if (!keyVal.trim()) return; const r = await app.addOrderKey(viewing.id, { addKey: keyVal, keyName, kind: selKind, pin: keyPin, productId: customPid || null, value: selKind === 'giftcard' && selItem ? selItem.price : null }); if (r.ok && r.order) { setViewing(r.order); setKeyVal(''); setKeyName(''); setKeyPin(''); setCustomPid(''); } }}>Send</button>
                  </div>
                  <p className="ord-deliver-hint muted">💻 Code / script: paste a download link, attach a file to the product, or type a code manually. 🎁 Gift cards: enter a code. The PIN field is optional for any item.</p>
                </>
              )}
            </div>
            <h4 style={hStyle}>Items</h4>
            <table className="adm-table compact">
              <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {(viewing.items || []).map((it, i) => (
                  <tr key={i}><td>{it.name}</td><td>{it.qty}</td><td>{money(it.price)}</td><td><b>{money(it.price * it.qty)}</b></td></tr>
                ))}
              </tbody>
            </table>
            <h4 style={hStyle}>Delivered items ({(viewing.keys || []).length})</h4>
            <div className="key-list">
              {(viewing.keys || []).map((k, i) => (
                <div key={i} className={'keyrow' + (k.kind === 'giftcard' ? ' gift' : '')}>
                  <div><div className="kn">{k.kind === 'giftcard' ? '\uD83C\uDF81 ' : ''}{k.name}{k.kind === 'giftcard' && k.value ? ' \u00b7 \u20b9' + k.value : ''}</div><code>{k.code}</code>{k.kind === 'giftcard' && k.pin ? <div className="key-pin">PIN <code>{k.pin}</code></div> : null}</div>
                  <button className="btn btn-soft btn-sm" onClick={() => navigator.clipboard.writeText(k.kind === 'giftcard' && k.pin ? (k.code + ' / PIN ' + k.pin) : k.code)}>Copy</button>
                </div>
              ))}
              {(viewing.keys || []).length === 0 && <p className="muted">Nothing delivered yet.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
const actionStyle = { textAlign: 'right' };
const approveBtn = { marginRight: 6 };
const hStyle = { marginTop: 20, marginBottom: 10 };
