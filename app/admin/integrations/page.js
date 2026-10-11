'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';

const EMAIL_KEYS = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'fromEmail'];

const GROUPS = [
  {
    id: 'google-auth', title: 'Google Sign-In', tag: 'Authentication',
    desc: 'Let customers sign in with their Google account. Create OAuth credentials in the Google Cloud Console, then paste them here.',
    fields: [
      { key: 'googleClientId', label: 'Client ID', ph: 'xxxxxxxx.apps.googleusercontent.com' },
      { key: 'googleClientSecret', label: 'Client Secret', ph: 'GOCSPX-…', secret: true },
      { key: 'googleRedirectUri', label: 'Authorized redirect URI', ph: 'https://yoursite.com/api/auth/google/callback' },
    ],
  },
  {
    id: 'email', title: 'Email service', tag: 'Email / SMTP',
    desc: 'Sends order receipts, license keys, and password-reset emails. Works with Gmail / Google Workspace SMTP or any provider (SendGrid, Resend, Mailgun…). Enter your details and hit Test connection — it shows Connected once verified.',
    fields: [
      { key: 'smtpHost', label: 'SMTP host', ph: 'smtp.gmail.com' },
      { key: 'smtpPort', label: 'SMTP port', ph: '587' },
      { key: 'smtpUser', label: 'SMTP username / email', ph: 'you@gmail.com' },
      { key: 'smtpPass', label: 'SMTP password / app password', ph: '••••••••', secret: true },
      { key: 'fromEmail', label: 'From address', ph: 'orders@yoursite.com' },
    ],
  },
  {
    id: 'analytics', title: 'Analytics', tag: 'Tracking',
    desc: 'Drop in a Google Analytics / Tag Manager ID to track visitors and conversions once your store is live.',
    fields: [
      { key: 'gaMeasurementId', label: 'Google Analytics ID', ph: 'G-XXXXXXXXXX' },
    ],
  },
];

export default function AdminIntegrations() {
  const app = useApp();
  const [draft, setDraft] = useState(null);
  const [show, setShow] = useState({});
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState(null);
  const [origin, setOrigin] = useState('');
  useEffect(() => { if (app?.settings) setDraft({ ...app.settings }); }, [app?.settings]);
  useEffect(() => { if (typeof window !== 'undefined') setOrigin(window.location.origin); }, []);
  if (!app || !app.admin || !draft) return null;

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v, ...(EMAIL_KEYS.includes(k) ? { emailVerified: false } : {}) }));
  const saveGroup = (g) => {
    const patch = {};
    g.fields.forEach((f) => { patch[f.key] = (draft[f.key] || '').trim(); });
    app.updateSettings(patch);
  };
  const isConfigured = (g) => g.fields.some((f) => (draft[f.key] || '').trim());
  const badgeFor = (g) => {
    if (g.id === 'email') {
      if (draft.emailVerified) return { ok: true, label: '● Connected' };
      return { ok: false, label: isConfigured(g) ? '○ Saved — not tested' : '○ Not set' };
    }
    if (g.id === 'google-auth') {
      const ready = (draft.googleClientId || '').trim() && (draft.googleClientSecret || '').trim();
      return ready ? { ok: true, label: '● Connected' } : { ok: false, label: isConfigured(g) ? '○ Add Client ID & Secret' : '○ Not set' };
    }
    return isConfigured(g) ? { ok: true, label: '● Connected' } : { ok: false, label: '○ Not set' };
  };

  const testEmail = async () => {
    setTesting(true); setTestMsg(null);
    const g = GROUPS.find((x) => x.id === 'email');
    const patch = {};
    g.fields.forEach((f) => { patch[f.key] = (draft[f.key] || '').trim(); });
    try {
      await app.updateSettings(patch);
      const res = await fetch('/api/email/verify', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        await app.updateSettings({ emailVerified: true });
        setTestMsg({ ok: true, msg: 'Connected! Your email service is verified and ready to send.' });
      } else {
        await app.updateSettings({ emailVerified: false });
        setTestMsg({ ok: false, msg: data.error || 'Could not connect. Double-check your SMTP host, port, username and password.' });
      }
    } catch (e) {
      setTestMsg({ ok: false, msg: 'Could not connect. Double-check your SMTP details.' });
    }
    setTesting(false);
  };

  return (
    <>
      <header className="adm-page-head">
        <div><h1>Integrations</h1><p className="muted">Connect Google sign-in, email, and payments. Paste your API keys here — the moment you go live the site uses them automatically.</p></div>
      </header>

      <div className="intg-note">
        <span className="intg-note-ic">🔌</span>
        <div>
          <b>How this works</b>
          <p>Add your real keys below and hit <b>Save</b> for each service to connect it. For production, we also recommend setting them as server environment variables.</p>
        </div>
      </div>

      <div className="intg-grid">
        {GROUPS.map((g) => {
          const badge = badgeFor(g);
          return (
          <section key={g.id} className="intg-card">
            <div className="intg-card-head">
              <div>
                <span className="intg-tag">{g.tag}</span>
                <h3>{g.title}</h3>
              </div>
              <span className={'intg-status' + (badge.ok ? ' ok' : '')}>{badge.label}</span>
            </div>
            <p className="intg-desc">{g.desc}</p>
            <div className="intg-fields">
              {g.fields.map((f) => (
                <div key={f.key} className="intg-field">
                  <label>{f.label}</label>
                  <div className="intg-input-wrap">
                    <input
                      type={f.secret && !show[f.key] ? 'password' : 'text'}
                      value={draft[f.key] || ''}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.ph}
                    />
                    {f.secret && <button type="button" className="intg-eye" onClick={() => setShow((s) => ({ ...s, [f.key]: !s[f.key] }))}>{show[f.key] ? 'Hide' : 'Show'}</button>}
                  </div>
                </div>
              ))}
            </div>
            {g.id === 'google-auth' && origin && (
              <div className="intg-cburl">In Google Cloud Console → Credentials, add this <b>exact</b> Authorized redirect URI:<code>{origin}/api/auth/google/callback</code></div>
            )}
            <div className="intg-actions">
              <button className="btn btn-primary btn-sm" onClick={() => saveGroup(g)}>Save {g.title}</button>
              {g.id === 'email' && <button className="btn btn-soft btn-sm" disabled={testing} onClick={testEmail}>{testing ? 'Testing…' : 'Test connection'}</button>}
            </div>
            {g.id === 'email' && testMsg && <div className={'eml-sent' + (testMsg.ok ? ' ok' : ' err')}>{testMsg.msg}</div>}
          </section>
          );
        })}
      </div>
    </>
  );
}
