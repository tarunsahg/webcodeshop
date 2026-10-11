'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/Providers';
import { money, catName } from '@/lib/format';

function ShieldIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z"/></svg>; }
function CheckIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function BoltIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }

export default function Cart() {
  const app = useApp();
  const [code, setCode] = useState('');
  const [cpMsg, setCpMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!app || !app.hydrated) return <div className="container" style={loadStyle}>Loading…</div>;
  const appliedCode = (app.coupon && app.coupon.code) || '';
  const discount = (app.coupon && app.coupon.discount) || 0;
  const items = app.cart.map((c) => ({ ...c, p: app.products.find((x) => x.id === c.pid) })).filter((x) => x.p);
  const subtotal = items.reduce((s, it) => s + (it.p ? it.p.price * it.qty : 0), 0);
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const res = await app.applyCoupon(code.trim().toUpperCase(), subtotal);
    setBusy(false);
    if (res.ok) setCpMsg({ ok: true, msg: `Applied! −${money(res.discount)}` });
    else setCpMsg({ ok: false, msg: res.error || 'Invalid code' });
  };
  const removeCoupon = () => { app.removeCoupon(); setCode(''); setCpMsg(null); };

  if (items.length === 0) {
    return (
      <div className="container" style={emptyWrap}>
        <div style={emptyIcon}>🛒</div>
        <h2 style={emptyH}>Your cart is empty</h2>
        <p className="muted" style={emptyP}>Discover premium code, scripts and gift cards to add to your collection.</p>
        <Link href="/shop" className="btn btn-primary btn-lg">Browse products →</Link>
      </div>
    );
  }

  return (
    <div className="cart-v2">
      <h1>Your cart</h1>
      <p className="sub">Review your items before checkout.</p>
      <div className="steps">
        <div className="step on"><span className="dot">1</span><span>Cart</span></div>
        <div className="step-line"/>
        <div className="step"><span className="dot">2</span><span>Checkout</span></div>
        <div className="step-line"/>
        <div className="step"><span className="dot">3</span><span>Done</span></div>
      </div>

      <div className="cart-grid">
        <div>
          {items.map((it) => {
            const thbStyle = { background: it.p.gr };
            return (
              <div key={it.pid} className="cart-item-v2">
                <div className="thb" style={thbStyle}>{it.p.icon}</div>
                <div>
                  <div className="ct">{catName(it.p.cat)}</div>
                  <div className="nm">{it.p.name}</div>
                  <div className="row">
                    <div className="qty-pill">
                      <button onClick={() => app.setQty(it.pid, Math.max(1, it.qty - 1))} aria-label="Decrease">−</button>
                      <span>{it.qty}</span>
                      <button onClick={() => app.setQty(it.pid, it.qty + 1)} aria-label="Increase">+</button>
                    </div>
                    <button className="rm" onClick={() => app.removeFromCart(it.pid)}>Remove</button>
                  </div>
                </div>
                <div className="pr-col">
                  <div className="pr">{money(it.p.price * it.qty)}</div>
                  {it.qty > 1 && <div className="pr-unit">{money(it.p.price)} each</div>}
                </div>
              </div>
            );
          })}
          <div style={contShopRow}>
            <Link href="/shop" className="btn btn-ghost">← Continue shopping</Link>
          </div>
        </div>

        <aside className="summary-v2">
          <h3>Order summary</h3>
          <div className="sr"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          {discount > 0 && <div className="sr discount"><span>Discount ({appliedCode})</span><span>−{money(discount)}</span></div>}
          <div className="sr"><span>Delivery</span><span style={freeStyle}>FREE · Instant</span></div>
          <div className="sr tot"><span>Total</span><span>{money(total)}</span></div>

          <div className="cp">
            {appliedCode ? (
              <div className="applied"><span>✓ {appliedCode}</span><button onClick={removeCoupon} style={removeCpBtn}>Remove</button></div>
            ) : (
              <>
                <input placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button className="btn btn-outline btn-sm" onClick={applyCoupon} disabled={busy}>{busy ? '…' : 'Apply'}</button>
              </>
            )}
          </div>
          {cpMsg && !appliedCode && <div style={cpMsgErr}>{cpMsg.msg}</div>}

          <Link href="/checkout" className="btn btn-primary btn-xl btn-block" style={checkoutBtn}>
            Checkout →
          </Link>

          <div className="perks">
            <div><CheckIcon/> Secure SSL checkout</div>
            <div><BoltIcon/> Instant license delivery</div>
            <div><ShieldIcon/> Secure signed downloads</div>
          </div>

          <div className="pay-icons">
            <span>VISA</span><span>MC</span><span>AMEX</span><span>PayPal</span><span>Stripe</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

const loadStyle = { padding: '80px 20px', textAlign: 'center', color: 'var(--muted)' };
const emptyWrap = { padding: '80px 20px', textAlign: 'center', maxWidth: 540, margin: '0 auto' };
const emptyIcon = { fontSize: 60, marginBottom: 16 };
const emptyH = { fontSize: 28, marginBottom: 10 };
const emptyP = { marginBottom: 24, fontSize: 15 };
const contShopRow = { marginTop: 18, textAlign: 'center' };
const freeStyle = { color: 'var(--accent-4)', fontWeight: 700 };
const removeCpBtn = { background: 'transparent', border: 0, color: 'inherit', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 };
const cpMsgErr = { fontSize: 12.5, color: '#dc2626', marginTop: -6, marginBottom: 4 };
const checkoutBtn = { marginTop: 14, padding: '14px 18px' };
