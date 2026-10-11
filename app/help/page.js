'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/Providers';

const FAQS = [
  { q: 'How do I receive my license keys?', a: 'Your license keys appear instantly on the order confirmation screen and in your account under Order history. They are also emailed to you. For manual UPI payments, keys are delivered the moment our team approves your payment.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI, Visa / Mastercard / RuPay cards, PayPal and Cash on Delivery. UPI payments are verified manually and approved within a few hours.' },
  { q: 'How long does UPI verification take?', a: 'Most UPI payments are verified within a few hours during business hours. You can track the status anytime in your account under Order history.' },
  { q: 'How do I download my files?', a: 'After your payment is confirmed, open your order under Account → Order history and click Download. Each download uses a private, secure link to keep your files safe.' },
  { q: 'Do products include updates?', a: 'Yes — most products include lifetime updates. Check the individual product page for the exact details.' },
  { q: 'I lost my license key. What do I do?', a: 'All of your keys are saved in your account under Order history. If you still cannot find a key, contact us and we will resend it right away.' },
  { q: 'How do I use a coupon code?', a: 'Enter your coupon code in the Promo code box on the checkout page and click Apply. The discount updates your total instantly.' },
  { q: 'Is my payment information secure?', a: 'Yes. Payments are processed over encrypted connections and we never store full card numbers on our servers.' },
];

export default function HelpCenter() {
  const app = useApp();
  const [query, setQuery] = useState('');
  const [openIdx, setOpenIdx] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const term = query.trim().toLowerCase();
  const filtered = term ? FAQS.filter((f) => f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term)) : FAQS;

  const [sending, setSending] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !msg.trim()) { if (app && app.showToast) app.showToast('Please fill in all fields', 'error'); return; }
    setSending(true);
    const r = app && app.submitSupport ? await app.submitSupport({ name: name.trim(), email: email.trim(), message: msg.trim() }) : { ok: true };
    setSending(false);
    if (r.ok) {
      if (app && app.showToast) app.showToast('Thanks! We will reply within 24 hours.', 'success');
      setName(''); setEmail(''); setMsg('');
    } else if (app && app.showToast) {
      app.showToast(r.error || 'Could not send. Please try again.', 'error');
    }
  };

  return (
    <div className="help-page">
      <section className="help-hero">
        <div className="container">
          <span className="help-eyebrow">Help Center</span>
          <h1>How can we help?</h1>
          <p>Search our FAQs or reach the WebCodeShop team directly.</p>
          <div className="help-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for an answer…" />
          </div>
        </div>
      </section>

      <div className="container help-grid">
        <div className="help-faqs">
          <h2>Frequently asked questions</h2>
          {filtered.length === 0 && <p className="muted">No results found. Try another search or contact us using the details on the right.</p>}
          {filtered.map((f, i) => (
            <div key={i} className={'help-faq' + (openIdx === i ? ' open' : '')}>
              <button className="help-q" onClick={() => setOpenIdx(openIdx === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="help-chev">⌄</span>
              </button>
              {openIdx === i && <div className="help-a">{f.a}</div>}
            </div>
          ))}
        </div>

        <aside className="help-side">
          <div className="help-card">
            <h3>Contact us</h3>
            <p className="muted">Our team is here Mon–Sat, 10am–7pm IST.</p>
            <ul className="help-contact">
              <li><span className="hc-ic">📞</span><a href="tel:+919718962885">+91 97189 62885</a></li>
              <li><span className="hc-ic">📞</span><a href="tel:+918586070279">+91 85860 70279</a></li>
              <li><span className="hc-ic">✉️</span><a href="mailto:contact@webcodeshop.com">contact@webcodeshop.com</a></li>
            </ul>
          </div>
          <div className="help-card">
            <h3>Send a message</h3>
            <form onSubmit={submit} className="help-form">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your email" />
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="How can we help?" rows={4} />
              <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</button>
            </form>
          </div>
          <div className="help-card help-links">
            <h3>Quick links</h3>
            <Link href="/account">My orders</Link>
            <Link href="/shop">Browse products</Link>
            <Link href="/terms">Terms of service</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/cookies">Cookie policy</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
