'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubInner() {
  const sp = useSearchParams();
  const email = sp.get('e') || '';
  const token = sp.get('t') || '';
  const [state, setState] = useState('loading'); // loading | ready | invalid
  const [unsub, setUnsub] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!email || !token) { setState('invalid'); return; }
    fetch('/api/email/unsubscribe?e=' + encodeURIComponent(email) + '&t=' + encodeURIComponent(token))
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ok) { setUnsub(!!d.unsubscribed); setState('ready'); }
        else setState('invalid');
      })
      .catch(() => setState('invalid'));
  }, [email, token]);

  const act = async (action) => {
    setBusy(true);
    try {
      const r = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, action }),
      });
      const d = await r.json();
      if (r.ok) setUnsub(!!d.unsubscribed);
    } catch {}
    setBusy(false);
  };

  if (state === 'loading') {
    return <div className="unsub-card"><p className="muted">Loading…</p></div>;
  }
  if (state === 'invalid') {
    return (
      <div className="unsub-card">
        <div className="unsub-ic err">✕</div>
        <h1>Link not valid</h1>
        <p className="muted">This unsubscribe link is invalid or has expired. You can manage email preferences from your account instead.</p>
        <Link href="/account" className="btn btn-primary">Go to my account</Link>
      </div>
    );
  }
  return (
    <div className="unsub-card">
      <div className={'unsub-ic' + (unsub ? '' : ' ok')}>{unsub ? '✉️' : '✓'}</div>
      <h1>{unsub ? 'You’re unsubscribed' : 'Email preferences'}</h1>
      <p className="muted">{unsub
        ? 'You will no longer receive marketing emails at ' + email + '. You’ll still get important emails about your orders and account.'
        : 'Manage marketing emails for ' + email + '. Order and account emails are always delivered.'}</p>
      {unsub ? (
        <button className="btn btn-soft" disabled={busy} onClick={() => act('resubscribe')}>{busy ? 'Saving…' : 'Resubscribe'}</button>
      ) : (
        <button className="btn btn-danger" disabled={busy} onClick={() => act('unsubscribe')}>{busy ? 'Saving…' : 'Unsubscribe from marketing emails'}</button>
      )}
      <div className="unsub-foot"><Link href="/">← Back to WebCodeShop</Link></div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="unsub-wrap">
      <Suspense fallback={<div className="unsub-card"><p className="muted">Loading…</p></div>}>
        <UnsubInner />
      </Suspense>
    </div>
  );
}
