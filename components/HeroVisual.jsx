'use client';

// Customer-facing hero visual: a live code-editor window (novashop.php) with
// floating "license delivered", "revenue today" and "new order" cards.
// Decorative only.
export default function HeroVisual() {
  return (
    <div className="hero-shop">
      <div className="hero-shop-glow" />

      <div className="ce-win">
        <div className="ce-bar">
          <span className="ce-dot" />
          <span className="ce-dot" />
          <span className="ce-dot" />
          <span className="ce-file">novashop.php</span>
          <span className="ce-live">LIVE</span>
        </div>
        <div className="ce-code">
          <div className="ce-line"><span className="ce-ln">1</span><span className="ce-tx"><span className="ce-cm">// Premium PHP eCommerce CMS</span></span></div>
          <div className="ce-line"><span className="ce-ln">2</span><span className="ce-tx"><span className="ce-kw">class</span>{' '}<span className="ce-fn">NovaShop</span>{' '}<span className="ce-pn">{'{'}</span></span></div>
          <div className="ce-line"><span className="ce-ln">3</span><span className="ce-tx">{'  '}<span className="ce-kw">public function</span>{' '}<span className="ce-fn">checkout</span><span className="ce-pn">{'( '}</span><span className="ce-var">$cart</span><span className="ce-pn">{' ) {'}</span></span></div>
          <div className="ce-line"><span className="ce-ln">4</span><span className="ce-tx">{'    '}<span className="ce-kw">return</span>{' '}<span className="ce-var">$this</span>{' '}<span className="ce-pn">-&gt;</span>{' '}<span className="ce-fn">payment</span></span></div>
          <div className="ce-line"><span className="ce-ln">5</span><span className="ce-tx">{'      '}<span className="ce-pn">-&gt;</span>{' '}<span className="ce-fn">charge</span><span className="ce-pn">{'( '}</span><span className="ce-var">$cart</span>{' '}<span className="ce-pn">-&gt;</span>{' '}<span className="ce-fn">total</span><span className="ce-pn">{' )'}</span></span></div>
          <div className="ce-line"><span className="ce-ln">6</span><span className="ce-tx">{'      '}<span className="ce-pn">-&gt;</span>{' '}<span className="ce-fn">deliverKeys</span><span className="ce-pn">();</span></span></div>
          <div className="ce-line"><span className="ce-ln">7</span><span className="ce-tx">{'  '}<span className="ce-pn">{'}'}</span></span></div>
          <div className="ce-line"><span className="ce-ln">8</span><span className="ce-tx"><span className="ce-pn">{'}'}</span></span></div>
          <div className="ce-line"><span className="ce-ln">9</span><span className="ce-tx">{' '}</span></div>
          <div className="ce-line"><span className="ce-ln">10</span><span className="ce-tx"><span className="ce-cm">// Production-ready  </span><span className="ce-ok">✓</span><span className="ce-cm"> Stripe + PayPal</span></span></div>
          <div className="ce-line"><span className="ce-ln">11</span><span className="ce-tx"><span className="ce-cm">// </span><span className="ce-ok">✓</span><span className="ce-cm"> Auto license delivery</span></span></div>
        </div>
      </div>

      <div className="fc fc-license">
        <span className="fc-check">✓</span>
        <div><b>License delivered</b><code>N2VA-A4F2-9KX1-PLM7</code></div>
      </div>

      <div className="fc fc-rev">
        <div className="lbl">Revenue today</div>
        <div className="amt">$4,829.50</div>
        <div className="chg">▲ +18.2% vs yesterday</div>
        <svg className="fc-spark" viewBox="0 0 120 30" preserveAspectRatio="none">
          <polygon points="0,30 0,24 18,20 36,22 54,13 72,16 90,8 108,11 120,4 120,30" fill="rgba(34,197,94,.13)" />
          <polyline points="0,24 18,20 36,22 54,13 72,16 90,8 108,11 120,4" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="fc fc-order">
        <span className="fc-ava">🛍</span>
        <div><b>New order #1052</b><span className="meta"><span className="live-dot" />Maria · just now</span></div>
      </div>
    </div>
  );
}
