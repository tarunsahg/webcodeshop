'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { money, fmtDate, fmtDateTime } from '@/lib/format';

const loadStyle = { padding: '80px 20px', textAlign: 'center', color: 'var(--muted)' };

function orderStatusInfo(status, hasKeys) {
  if (status === 'pending') return { label: 'Pending', bg: '#fef3c7', fg: '#92400e' };
  if (status === 'failed') return { label: 'Failed', bg: '#fee2e2', fg: '#991b1b' };
  if (status === 'completed' && !hasKeys) return { label: 'Processing', bg: '#dbeafe', fg: '#1e40af' };
  return { label: 'Completed', bg: '#dcfce7', fg: '#166534' };
}

function paymentLabel(m) {
  if (m === 'upi') return 'UPI (manual verification)';
  if (m === 'cod') return 'Cash on delivery';
  if (m === 'card') return 'Card';
  if (m === 'paypal') return 'PayPal';
  return (m || 'card').toUpperCase();
}

export default function TrackOrder() {
  const app = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params && params.id ? decodeURIComponent(params.id) : '';

  useEffect(() => {
    if (app && app.authReady && !app.user) router.push('/login?next=/account');
  }, [app, router]);

  if (!app || !app.authReady) return <div className="container" style={loadStyle}>Loading…</div>;
  if (!app.user) return null;

  const orders = (app.orders || []).filter((o) => o.userId === app.user.id || o.email === app.user.email);
  const o = orders.find((x) => x.id === id);

  if (!o) {
    return (
      <div className="trk">
        <Link href="/account" className="trk-back">← Back to account</Link>
        <div className="shop-empty">
          <div className="ic">🔍</div>
          <h3>Order not found</h3>
          <p className="muted">We couldn&apos;t find an order with that number on your account.</p>
          <Link href="/account" className="btn btn-primary">Back to orders</Link>
        </div>
      </div>
    );
  }

  const isPending = o.status === 'pending';
  const isCompleted = o.status === 'completed';
  const isBad = o.status === 'failed';
  const hasKeys = o.keys && o.keys.length > 0;
  const sk = orderStatusInfo(o.status, hasKeys);
  const badgeStyle = { background: sk.bg, color: sk.fg };
  const itemCount = (o.items || []).length;

  const hasGiftItem = (o.items || []).some((it) => it.kind === 'giftcard');
  const hasCodeItem = (o.items || []).some((it) => it.kind !== 'giftcard');
  const deliverNoun = hasCodeItem && hasGiftItem ? 'downloads & codes' : hasGiftItem ? 'gift codes' : 'downloads';
  const heroIcon = isBad ? '⚠️' : hasKeys ? '🎉' : isPending ? '⏳' : '📦';

  const steps = [
    { t: 'Order placed', d: 'We received your order', done: true },
    { t: isBad ? 'Payment failed' : 'Payment confirmed', d: isPending ? 'Verifying your payment…' : (isBad ? 'Could not be completed' : 'Payment received'), done: !isPending && !isBad, active: isPending, bad: isBad },
    { t: 'Delivered', d: hasKeys ? 'Your ' + deliverNoun + ' are ready' : 'Awaiting delivery', done: hasKeys, active: !hasKeys && !isPending && !isBad },
    { t: 'Completed', d: hasKeys ? 'Order complete — enjoy!' : 'Delivered shortly', done: isCompleted && hasKeys },
  ];

  const copyText = (text, label) => { navigator.clipboard.writeText(text); app.showToast(label, 'success'); };

  return (
    <div className="trk">
      <Link href="/account" className="trk-back">← Back to account</Link>

      <div className={'trk-hero' + (isBad ? ' bad' : hasKeys ? ' done' : isPending ? ' wait' : '')}>
        <div className="trk-hero-txt">
          <span className="trk-hero-badge" style={badgeStyle}>{sk.label}</span>
          <h1>Order {o.id}</h1>
          <p>{fmtDate(o.date)} · {itemCount} item{itemCount === 1 ? '' : 's'} · <b>{money(o.total)}</b></p>
        </div>
        <div className="trk-hero-ic">{heroIcon}</div>
      </div>

      <div className="trk-grid">
        <div className="trk-main">
          {o.adminMessage && (
            <div className="trk-msg">
              <span className="trk-msg-ic">💬</span>
              <div><div className="trk-msg-lbl">Message from team</div><p>{o.adminMessage}</p></div>
            </div>
          )}

          {isBad && (
            <div className="trk-alert bad">
              <b>Payment not confirmed</b>
              <span>We couldn&apos;t verify this payment. If you think this is a mistake, contact support with your order number.</span>
            </div>
          )}

          {isPending && (
            <div className="trk-alert wait">
              <b>⏳ Payment under verification{o.txnId ? ' · Txn ID ' + o.txnId : ''}</b>
              <span>Your {deliverNoun} will appear here once approved.</span>
            </div>
          )}

          {hasKeys ? (
            <div className="trk-deliver">
              <div className="trk-deliver-head">
                <h2>Your delivery</h2>
                <span className="trk-deliver-count">{o.keys.length} item{o.keys.length === 1 ? '' : 's'}</span>
              </div>
              <div className="dcards">
                {o.keys.map((k, i) => {
                  const isGift = k.kind === 'giftcard';
                  if (isGift) {
                    return (
                      <div key={i} className="dcard gift">
                        <div className="dcard-top"><span className="dcard-tag gift">🎁 Gift card</span>{k.value ? <span className="dcard-val">₹{k.value}</span> : null}</div>
                        <div className="dcard-name">{k.name}</div>
                        <div className="dcard-field"><span>Code</span><code>{k.code}</code></div>
                        {k.pin ? <div className="dcard-field"><span>PIN</span><code>{k.pin}</code></div> : null}
                        <div className="dcard-actions">
                          <button className="btn btn-primary dcard-btn" onClick={() => copyText(k.code, 'Gift code copied')}>Copy code</button>
                          {k.pin ? <button className="btn btn-outline dcard-btn" onClick={() => copyText(k.pin, 'PIN copied')}>Copy PIN</button> : null}
                        </div>
                      </div>
                    );
                  }
                  const direct = /^(https?:[/][/]|[/]uploads[/])/i.test(k.code || '');
                  if (direct) {
                    return (
                      <div key={i} className="dcard code">
                        <div className="dcard-top"><span className="dcard-tag code">💻 Code / script</span><span className="dcard-ready">● Ready</span></div>
                        <div className="dcard-name">{k.name}</div>
                        <p className="dcard-note">Your files are ready — click below to download.</p>
                        <button className="btn btn-primary dcard-btn" onClick={() => window.open(k.code, '_blank')}>⬇ Download files</button>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="dcard code">
                      <div className="dcard-top"><span className="dcard-tag code">💻 Code / script</span><span className="dcard-ready">● Ready</span></div>
                      <div className="dcard-name">{k.name}</div>
                      <div className="dcard-field"><span>Code</span><code>{k.code}</code></div>
                      {k.pin ? <div className="dcard-field"><span>PIN</span><code>{k.pin}</code></div> : null}
                      <div className="dcard-actions">
                        <button className="btn btn-primary dcard-btn" onClick={() => copyText(k.code, 'Code copied')}>Copy code</button>
                        {k.pin ? <button className="btn btn-outline dcard-btn" onClick={() => copyText(k.pin, 'PIN copied')}>Copy PIN</button> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasGiftItem ? <div className="trk-tip gift">🎁 Treat gift codes like cash — keep the code and PIN private.</div> : null}
            </div>
          ) : (!isBad && !isPending) ? (
            <div className="trk-empty">
              <div className="trk-empty-ic">📦</div>
              <b>Preparing your delivery</b>
              <span>Your {deliverNoun} will appear here once your order is approved and delivered.</span>
            </div>
          ) : null}
        </div>

        <aside className="trk-side">
          <div className="trk-card trk-steps">
            <div className="trk-card-title">Track order</div>
            <ol className="aot-steps">
              {steps.map((s, si) => (
                <li key={si} className={'aot-step' + (s.done ? ' done' : '') + (s.active ? ' active' : '') + (s.bad ? ' bad' : '')}>
                  <span className="aot-dot">{s.done ? '✓' : si + 1}</span>
                  <div className="aot-txt"><b>{s.t}</b><span>{s.d}</span></div>
                </li>
              ))}
            </ol>
          </div>

          <div className="trk-card">
            <div className="trk-card-title">Order summary</div>
            {(o.items || []).map((it, i) => (
              <div key={i} className="ti-row"><span>{it.kind === 'giftcard' ? '🎁 ' : '💻 '}{it.name} × {it.qty}</span><b>{money(it.price * it.qty)}</b></div>
            ))}
            {o.discount > 0 && <div className="ti-row discount"><span>Discount {o.coupon ? '(' + o.coupon + ')' : ''}</span><b>−{money(o.discount)}</b></div>}
            <div className="ti-row tot"><span>Total</span><b>{money(o.total)}</b></div>
          </div>

          <div className="trk-card">
            <div className="trk-card-title">Contact details</div>
            <p className="ti-line"><span className="muted">Name</span> {o.name || '—'}</p>
            <p className="ti-line"><span className="muted">Email</span> {o.email || '—'}</p>
            <p className="ti-line"><span className="muted">Phone</span> {o.phone || '—'}</p>
          </div>

          <div className="trk-card">
            <div className="trk-card-title">Payment</div>
            <p className="ti-line"><span className="muted">Method</span> {paymentLabel(o.paymentMethod)}</p>
            {o.txnId && <p className="ti-line"><span className="muted">Txn ID</span> {o.txnId}</p>}
            {o.coupon && <p className="ti-line"><span className="muted">Coupon</span> {o.coupon}</p>}
            <p className="ti-line"><span className="muted">Placed</span> {fmtDateTime(o.date)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
