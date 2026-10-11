'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/components/Providers';

const loadingStyle = { padding: 24 };
const emptyStyle = { padding: 40, textAlign: 'center' };

export default function AdminMessages() {
  const app = useApp();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!app || !app.loadSupportMessages) return;
    setLoading(true);
    const r = await app.loadSupportMessages();
    setMessages(r.messages || []);
    setLoading(false);
  };

  useEffect(() => {
    if (app && app.admin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app && app.admin]);

  if (!app || !app.admin) return null;

  const remove = async (id) => {
    if (!app.deleteSupportMessage) return;
    const r = await app.deleteSupportMessage(id);
    if (r.ok) {
      setMessages((m) => m.filter((x) => x.id !== id));
      if (app.showToast) app.showToast('Message deleted', 'success');
    } else if (app.showToast) {
      app.showToast(r.error || 'Could not delete', 'error');
    }
  };

  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1>Help center messages</h1>
          <p className="muted">{messages.length} message{messages.length === 1 ? '' : 's'} from the Help Center contact form.</p>
        </div>
        <button className="btn btn-soft btn-sm" onClick={load}>Refresh</button>
      </header>
      <section className="adm-card">
        {loading ? (
          <p className="muted" style={loadingStyle}>Loading…</p>
        ) : messages.length === 0 ? (
          <div className="muted" style={emptyStyle}>No messages yet. Visitor messages from the Help Center will show up here.</div>
        ) : (
          <div className="msg-list">
            {messages.map((m) => (
              <div key={m.id} className="msg-item">
                <div className="msg-avatar">{(m.name || m.email || '?').slice(0, 1).toUpperCase()}</div>
                <div className="msg-main">
                  <div className="msg-top">
                    <div>
                      <b>{m.name || 'Anonymous'}</b>
                      {m.email ? <a className="msg-email" href={'mailto:' + m.email}>{m.email}</a> : null}
                    </div>
                    <span className="msg-date">{m.date ? new Date(m.date).toLocaleString() : ''}</span>
                  </div>
                  <p className="msg-body">{m.message}</p>
                  <div className="msg-actions">
                    {m.email ? <a className="btn btn-soft btn-sm" href={'mailto:' + m.email + '?subject=' + encodeURIComponent('Re: your WebCodeShop message')}>Reply by email</a> : null}
                    <button className="btn btn-outline btn-sm" onClick={() => remove(m.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
