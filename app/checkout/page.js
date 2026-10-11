'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { money, catName } from '@/lib/format';

export default function Checkout() {
  const app = useApp();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [cpMsg, setCpMsg] = useState(null);
  const [pay, setPay] = useState('upi');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cc, setCc] = useState('+91');
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState(null);
  const [txnId, setTxnId] = useState('');
  // inline auth gate (shown at checkout instead of bouncing to /login)
  const [authMode, setAuthMode] = useState('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authErr, setAuthErr] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    if (app && app.user) {
      setName(app.user.name || '');
      setEmail(app.user.email || '');
    }
  }, [app]);

  // Always show the top of the page when the order result (success/pending) appears
  useEffect(() => {
    if (order) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [order]);

  if (!app || !app.authReady) return <div className="container" style={loadStyle}>Loading…</div>;

  // Not signed in: show sign in / sign up right here at checkout (cart stays saved)
  if (!app.user) {
    const submitAuth = async (e) => {
      e.preventDefault();
      setAuthBusy(true); setAuthErr(null);
      const res = authMode === 'login'
        ? await app.login(authEmail.trim(), authPass)
        : await app.register(authName.trim(), authEmail.trim(), authPass);
      setAuthBusy(false);
      if (!res.ok) setAuthErr(res.error || 'Something went wrong');
    };
    return (
      <div className="checkout-v2">
        <h1 style={hStyle}>Checkout</h1>
        <div className="steps" style={stepsTop}>
          <div className="step on"><span className="dot">1</span><span>Sign in</span></div>
          <div className="step-line"/>
          <div className="step"><span className="dot">2</span><span>Payment</span></div>
          <div className="step-line"/>
          <div className="step"><span className="dot">3</span><span>Done</span></div>
        </div>
        <div className="checkout-auth-card">
          <h3>{authMode === 'login' ? 'Sign in to complete your order' : 'Create your account to continue'}</h3>
          <p className="muted ca-sub">Your cart is saved — just {authMode === 'login' ? 'sign in' : 'sign up'} to place your order.</p>
          <form onSubmit={submitAuth}>
            {authMode === 'register' && (
              <div className="field"><label>Full name</label><input value={authName} onChange={(e) => setAuthName(e.target.value)} required/></div>
            )}
            <div className="field"><label>Email</label><input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required autoComplete="email"/></div>
            <div className="field"><label>Password</label><input type="password" value={authPass} onChange={(e) => setAuthPass(e.target.value)} required autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}/></div>
            {authMode === 'login' && (
              <div className="forgot-row"><Link href="/forgot-password">Forgot password?</Link></div>
            )}
            {authErr && <div style={errStyle}>{authErr}</div>}
            <button type="submit" className="btn btn-primary btn-xl btn-block" disabled={authBusy} style={placeBtn}>
              {authBusy ? <><span className="spinner"/> Please wait…</> : (authMode === 'login' ? 'Sign in & continue' : 'Create account & continue')}
            </button>
          </form>
          <div className="checkout-auth-switch">
            {authMode === 'login' ? (
              <>New to WebCodeShop? <button type="button" onClick={() => { setAuthMode('register'); setAuthErr(null); }}>Create an account</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => { setAuthMode('login'); setAuthErr(null); }}>Sign in</button></>
            )}
          </div>
        </div>
      </div>
    );
  }

  const items = app.cart.map((c) => ({ ...c, p: app.products.find((x) => x.id === c.pid) })).filter((x) => x.p);
  const subtotal = items.reduce((s, it) => s + it.p.price * it.qty, 0);
  const appliedCode = (app.coupon && app.coupon.code) || '';
  const discount = (app.coupon && app.coupon.discount) || 0;
  const total = Math.max(0, subtotal - discount);

  if (items.length === 0 && !order) {
    return (
      <div className="container" style={emptyCheckoutWrap}>
        <h2>Your cart is empty</h2>
        <p className="muted" style={emptyP}>Add a product before checking out.</p>
        <Link href="/shop" className="btn btn-primary">Browse products</Link>
      </div>
    );
  }

  const applyCoupon = async () => {
    if (!code.trim()) return;
    const res = await app.applyCoupon(code.trim().toUpperCase(), subtotal);
    if (res.ok) setCpMsg({ ok: true, msg: `−${money(res.discount)} applied` });
    else setCpMsg({ ok: false, msg: res.error || 'Invalid' });
  };
  const removeCoupon = () => { app.removeCoupon(); setCode(''); setCpMsg(null); };

  const upiId = 'anuj006@fam';
  const upiLink = `upi://pay?pa=${upiId}&pn=WebCodeShop&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('WebCodeShop order')}`;
  const qrBase = 'https://' + 'api.qrserver.com/v1/create-qr-code/';
  const upiQr = `${qrBase}?size=240x240&margin=10&data=${encodeURIComponent(upiLink)}`;

  const placeOrder = async (e) => {
    e.preventDefault();
    if (phone.trim().length !== 10) { setErr('Please enter a valid 10-digit mobile number.'); return; }
    if (pay === 'upi' && txnId.trim().length !== 12) { setErr('Please enter the 12-character UPI transaction ID after paying.'); return; }
    setBusy(true); setErr(null);
    const res = await app.placeOrder(appliedCode, pay, pay === 'upi' ? txnId.trim() : null, (cc + ' ' + phone.trim()).trim());
    setBusy(false);
    if (res.ok) setOrder(res.order);
    else setErr(res.error || 'Failed to place order');
  };

  if (order) {
    const pending = order.status === 'pending';
    return (
      <div className="pay-done">
        <div className={'paydone-card' + (pending ? ' pending' : '')}>
          <div className="paydone-head">
            <div className={'paydone-ic' + (pending ? ' wait' : '')}>{pending ? '⏳' : '🎉'}</div>
            <div>
              <h1>{pending ? 'Payment submitted!' : 'Order confirmed!'}</h1>
              <p className="paydone-meta">Order <b>{order.id}</b> · {pending ? "We're verifying your UPI payment" : ('Receipt sent to ' + order.email)}</p>
            </div>
          </div>
          {pending ? (
            <div className="paydone-body">
              <div className="paydone-summary">
                <div className="pds-items">
                  {(order.items || []).map((it, i) => (
                    <div key={i} className="pds-item"><span>{it.name} <em>× {it.qty}</em></span><b>{money(it.price * it.qty)}</b></div>
                  ))}
                </div>
                <div className="pds-row"><span>Subtotal</span><span>{money(order.subtotal || order.total)}</span></div>
                {order.discount > 0 && <div className="pds-row discount"><span>Discount{order.coupon ? ' (' + order.coupon + ')' : ''}</span><span>−{money(order.discount)}</span></div>}
                <div className="pds-row tot"><span>Amount paid</span><b>{money(order.total)}</b></div>
                <div className="pds-row"><span>Payment method</span><b>{(order.paymentMethod || 'upi').toUpperCase()}</b></div>
                <div className="pds-row"><span>Transaction ID</span><b className="mono">{order.txnId || txnId}</b></div>
                <div className="pds-row"><span>Status</span><span className="status-pill pending">Pending approval</span></div>
                <p className="pds-hint">Your downloads &amp; codes appear here and by email once approved.</p>
              </div>
              <div className="paydone-timeline">
                <div className="pt-step done"><div className="pt-dot">✓</div><div className="pt-tx"><b>Payment received</b><span>We've logged your UPI transaction.</span></div></div>
                <div className="pt-step active"><div className="pt-dot">2</div><div className="pt-tx"><b>Admin verifies payment</b><span>Usually within a few hours.</span></div></div>
                <div className="pt-step"><div className="pt-dot">3</div><div className="pt-tx"><b>Order delivered</b><span>Downloads &amp; codes unlocked after approval.</span></div></div>
              </div>
            </div>
          ) : (
            <div className="success-keys">
              <h4>Your downloads &amp; codes</h4>
              {order.keys.map((k, i) => (
                <div key={i} className="keyrow">
                  <div><div className="kn">{k.name}</div><code>{k.code}</code></div>
                  <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(k.code); app.showToast('Copied', 'success'); }}>Copy</button>
                </div>
              ))}
            </div>
          )}
          <div className="success-actions">
            <Link href="/account" className="btn btn-primary btn-lg">View my orders</Link>
            <Link href="/shop" className="btn btn-ghost btn-lg">Continue shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-v2">
      <h1 style={hStyle}>Checkout</h1>
      <div className="steps" style={stepsTop}>
        <div className="step done"><span className="dot">✓</span><span>Cart</span></div>
        <div className="step-line"/>
        <div className="step on"><span className="dot">2</span><span>Checkout</span></div>
        <div className="step-line"/>
        <div className="step"><span className="dot">3</span><span>Done</span></div>
      </div>

      <form onSubmit={placeOrder}>
        <div className="layout">
          <aside className="summary-v2 co-summary">
            <h3>Your order</h3>
            <div style={itemsList}>
              {items.map((it) => {
                const thumbStyle = { ...liThumb, background: it.p.gr };
                return (
                  <div key={it.pid} style={lineItem}>
                    <div style={thumbStyle} className="thb"><span style={liIcon}>{it.p.icon}</span></div>
                    <div style={liInfo}>
                      <div style={liName}>{it.p.name}</div>
                      <div style={liQty}>Qty {it.qty}</div>
                    </div>
                    <div style={liPrice}>{money(it.p.price * it.qty)}</div>
                  </div>
                );
              })}
            </div>
            <div className="sr"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div className="sr discount"><span>Discount</span><span>−{money(discount)}</span></div>}
            <div className="sr"><span>Delivery</span><span style={freeStyle}>FREE</span></div>
            <div className="sr tot"><span>Total</span><span>{money(total)}</span></div>
            <div className="cp">
              {appliedCode ? (
                <div className="applied"><span>✓ {appliedCode}</span><button type="button" onClick={removeCoupon} style={cpRemoveBtn}>Remove</button></div>
              ) : (
                <>
                  <input placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value)}/>
                  <button type="button" className="btn btn-outline btn-sm" onClick={applyCoupon}>Apply</button>
                </>
              )}
            </div>
            {cpMsg && !appliedCode && <div style={cpMsgErr}>{cpMsg.msg}</div>}
            <button type="submit" className="btn btn-primary btn-xl btn-block co-place-desktop" disabled={busy} style={placeBtn}>
              {busy ? <><span className="spinner"/> Processing…</> : (pay === 'upi' ? "I've paid — Submit for review" : `Place order — ${money(total)}`)}
            </button>
          </aside>

          <div className="panel co-contact">
            <h3><span className="n">1</span> Contact information</h3>
            <div className="row2">
              <div className="field"><label>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} required/></div>
              <div className="field"><label>Mobile number</label>
                <div className="phone-row">
                  <select className="cc-select" value={cc} onChange={(e) => setCc(e.target.value)} aria-label="Country code">
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+880">🇧🇩 +880</option>
                    <option value="+92">🇵🇰 +92</option>
                    <option value="+977">🇳🇵 +977</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+49">🇩🇪 +49</option>
                  </select>
                  <input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="10-digit number" required/>
                </div>
              </div>
            </div>
            <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></div>
          </div>

          <div className="panel co-payment">
            <h3><span className="n">2</span> Payment method</h3>
            {pay === 'upi' && (
              <div className="upi-gw">
                <div className="upi-gw-head">
                  <div className="upi-gw-brand"><span className="upi-gw-logo">UPI</span> Secure UPI Gateway</div>
                  <span className="upi-gw-secure">🔒 256-bit encrypted</span>
                </div>
                <div className="upi-gw-amt-bar"><span>Amount payable</span><b>{money(total)}</b></div>
                <div className="upi-pay">
                  <div className="upi-qr-card">
                    <img src={upiQr} alt="UPI payment QR code" className="upi-qr" width={200} height={200}/>
                    <div className="upi-qr-amt">{money(total)}</div>
                    <div className="upi-qr-sub">Amount locked · Scan to pay</div>
                  </div>
                  <div className="upi-info">
                    <div className="upi-step"><span className="upi-num">1</span><span>Open any UPI app — GPay, PhonePe, Paytm or your bank — and scan the QR. The amount <b>{money(total)}</b> is pre-filled and cannot be changed.</span></div>
                    <div className="upi-id-row">
                      <div><span className="upi-id-lbl">Or pay to UPI ID</span><b>{upiId}</b></div>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(upiId); app.showToast('UPI ID copied', 'success'); }}>Copy</button>
                    </div>
                    <div className="upi-step"><span className="upi-num">2</span><span>After paying, enter the <b>12-character</b> transaction / UTR ID from your UPI app and submit for verification.</span></div>
                    <div className="field"><label>Transaction / UTR ID <span className="upi-hint">(12 characters)</span></label><input value={txnId} onChange={(e) => setTxnId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12))} maxLength={12} placeholder="e.g. 4398211002AB"/><div className="upi-count">{txnId.length}/12</div></div>
                    <div className="upi-note">🔒 Payments are verified manually by our team. Your downloads & codes unlock automatically the moment the payment is approved.</div>
                  </div>
                </div>
              </div>
            )}
            {err && <div style={errStyle}>{err}</div>}
          </div>

          <button type="submit" className="btn btn-primary btn-xl btn-block co-place-mobile" disabled={busy} style={placeBtn}>
            {busy ? <><span className="spinner"/> Processing…</> : (pay === 'upi' ? "I've paid — Submit for review" : `Place order — ${money(total)}`)}
          </button>
        </div>
      </form>
    </div>
  );
}

const loadStyle = { padding: '80px 20px', textAlign: 'center', color: 'var(--muted)' };
const hStyle = { fontSize: 34, marginBottom: 14 };
const stepsTop = { marginBottom: 28 };
const sticky = { position: 'sticky', top: 90, alignSelf: 'start' };
const itemsList = { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' };
const lineItem = { display: 'flex', alignItems: 'center', gap: 12 };
const liThumb = { width: 44, height: 44, borderRadius: 10, display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0, color: '#fff' };
const liIcon = { fontSize: 20 };
const liInfo = { flex: 1, minWidth: 0 };
const liName = { fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const liQty = { fontSize: 12, color: 'var(--muted)' };
const liPrice = { fontSize: 13.5, fontWeight: 700, color: 'var(--text)' };
const freeStyle = { color: 'var(--accent-4)', fontWeight: 700 };
const placeBtn = { marginTop: 16 };
const cpRemoveBtn = { background: 'transparent', border: 0, color: 'inherit', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 };
const cpMsgErr = { fontSize: 12.5, color: '#dc2626', marginTop: -6, marginBottom: 4 };
const errStyle = { padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 10, fontSize: 13.5, fontWeight: 600, marginTop: 10 };
const emptyCheckoutWrap = { padding: '80px 20px', textAlign: 'center' };
const emptyP = { marginBottom: 20 };
