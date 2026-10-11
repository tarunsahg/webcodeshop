'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';

const TEMPLATES = [
  { id: 'welcome', name: 'Welcome / Account created', vars: '[name], [email]', subject: 'Welcome to [brand], [name]! 🎉', body: 'Hi [name],\n\nThanks for creating an account at [brand]. You can now buy premium code, scripts and digital gift cards — delivered instantly.\n\nStart browsing: [siteUrl]/shop\n\n— The [brand] team' },
  { id: 'order_confirmation', name: 'Order received (pending payment)', vars: '[name], [orderId], [total]', subject: 'We received your order [orderId]', body: 'Hi [name],\n\nThanks for your order [orderId] totalling [total]. We are verifying your payment and will deliver your keys as soon as it is approved.\n\nTrack your order: [siteUrl]/account/orders/[orderId]\n\n— [brand]' },
  { id: 'payment_approved', name: 'Payment approved / Order confirmed', vars: '[name], [orderId], [total]', subject: '✅ Payment approved — order [orderId] confirmed', body: 'Hi [name],\n\nGreat news! Your payment for order [orderId] ([total]) has been approved. Your license keys are now available in your account.\n\nView keys: [siteUrl]/account/orders/[orderId]\n\n— [brand]' },
  { id: 'key_delivery', name: 'License key / code delivered', vars: '[name], [orderId], [productName], [licenseKey]', subject: 'Your [productName] key is ready 🔑', body: 'Hi [name],\n\nHere is your key for [productName] (order [orderId]):\n\n[licenseKey]\n\nDownloads & docs: [siteUrl]/account/orders/[orderId]\n\nEnjoy!\n— [brand]' },
  { id: 'order_failed', name: 'Payment not received / Order failed', vars: '[name], [orderId]', subject: 'Action needed: payment not received for [orderId]', body: 'Hi [name],\n\nWe could not verify the payment for order [orderId], so it has been marked as failed. If you have already paid, reply with your transaction ID and we will sort it out right away.\n\nRetry checkout: [siteUrl]/checkout\n\n— [brand]' },
  { id: 'password_reset', name: 'Password reset', vars: '[name], [resetLink]', subject: 'Reset your [brand] password', body: 'Hi [name],\n\nWe received a request to reset your password. Click the link below to choose a new one (valid for 1 hour):\n\n[resetLink]\n\nIf you did not request this, you can safely ignore this email.\n\n— [brand]' },
  { id: 'abandoned_cart', name: 'Abandoned cart reminder', vars: '[name], [cartUrl]', subject: 'You left something in your cart 🛒', body: 'Hi [name],\n\nYour cart is still waiting! Complete your purchase before these items are gone.\n\nResume checkout: [cartUrl]\n\n— [brand]' },
  { id: 'newsletter_welcome', name: 'Newsletter welcome', vars: '[email]', subject: 'Thanks for subscribing to [brand]', body: 'Hi there,\n\nThanks for subscribing! You will get fresh drops, deals and promo codes — about one email a week, no spam, unsubscribe anytime.\n\n— [brand]' },
  { id: 'support_reply', name: 'Support / contact reply', vars: '[name], [message]', subject: 'Re: your message to [brand] support', body: 'Hi [name],\n\nThanks for reaching out. [message]\n\nLet us know if there is anything else we can help with.\n\n— [brand] support' },
];

export default function AdminEmails() {
  const app = useApp();
  const [active, setActive] = useState(TEMPLATES[0].id);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [testTo, setTestTo] = useState('');
  const [sent, setSent] = useState(null);

  const tpl = TEMPLATES.find((t) => t.id === active) || TEMPLATES[0];

  useEffect(() => {
    const s = (app && app.settings) || {};
    const sub = s['emailtpl_' + active + '_subject'];
    const bod = s['emailtpl_' + active + '_body'];
    setSubject(sub != null ? sub : tpl.subject);
    setBody(bod != null ? bod : tpl.body);
    setSent(null);
  }, [active, app?.settings]);

  if (!app || !app.admin) return null;

  const save = () => app.updateSettings({ ['emailtpl_' + active + '_subject']: subject, ['emailtpl_' + active + '_body']: body });
  const resetTpl = () => { setSubject(tpl.subject); setBody(tpl.body); };
  const sendTest = async () => {
    const to = (testTo || (app.user && app.user.email) || '').trim();
    if (!to) { setSent({ ok: false, msg: 'Enter an email address to send the test to.' }); return; }
    setSent({ ok: true, msg: 'Sending…' });
    try {
      const res = await fetch('/api/email/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ to, subject, body }) });
      const data = await res.json();
      if (res.ok) {
        setSent({ ok: true, msg: data.provider === 'console' ? 'No email service connected yet — connect SMTP in Integrations to deliver real emails.' : 'Test email sent to ' + to + ' ✓' });
      } else {
        setSent({ ok: false, msg: data.error || 'Could not send. Check your email settings in Integrations.' });
      }
    } catch (e) {
      setSent({ ok: false, msg: 'Could not send. Check your email settings in Integrations.' });
    }
  };

  return (
    <>
      <header className="adm-page-head">
        <div><h1>Email templates</h1><p className="muted">Every transactional email your store sends. Edit the copy, then send yourself a test once your email service is connected.</p></div>
      </header>
      <div className="eml-layout">
        <aside className="eml-list">
          {TEMPLATES.map((t) => (
            <button key={t.id} className={'eml-item' + (active === t.id ? ' on' : '')} onClick={() => setActive(t.id)}>
              <b>{t.name}</b>
              <span>{t.vars}</span>
            </button>
          ))}
        </aside>
        <section className="eml-editor">
          <div className="eml-field">
            <label>Subject line</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="eml-field">
            <label>Email body</label>
            <textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <p className="eml-vars">Variables: <code>{tpl.vars}</code>, <code>[brand]</code>, <code>[siteUrl]</code> — these are filled in automatically when the email is sent.</p>
          <div className="eml-actions">
            <button className="btn btn-primary btn-sm" onClick={save}>Save template</button>
            <button className="btn btn-ghost btn-sm" onClick={resetTpl}>Reset to default</button>
          </div>
          <div className="eml-test">
            <h4>Send a test email</h4>
            <div className="eml-test-row">
              <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder={(app.user && app.user.email) || 'you@email.com'} />
              <button className="btn btn-soft btn-sm" onClick={sendTest}>Send test email</button>
            </div>
            {sent && <div className={'eml-sent' + (sent.ok ? ' ok' : ' err')}>{sent.msg}</div>}
          </div>
        </section>
      </div>
    </>
  );
}
