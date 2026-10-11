'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';

export default function ProfilePage() {
  const app = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!app || !app.hydrated) return;
    if (!app.user) router.replace('/login');
    else setName(app.user.name || '');
  }, [app, router]);

  if (!app || !app.user) return null;
  const isGoogle = app.user.provider === 'google';

  async function saveName(e) {
    e.preventDefault();
    setSaving(true); setErr(null);
    try { await app.updateProfile({ name }); app.showToast('Profile updated', 'success'); }
    catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  async function savePw(e) {
    e.preventDefault();
    if (newPw !== newPw2) { setErr('Passwords do not match'); return; }
    setSaving(true); setErr(null);
    try {
      await app.updateProfile({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setNewPw2('');
      app.showToast('Password updated', 'success');
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <main className="container" style={pageStyle}>
      <div className="prof-head">
        <Link href="/account" className="crumb">← Back to account</Link>
        <h1>Profile settings</h1>
        <p className="muted">Update your name and password.</p>
      </div>

      <section className="prof-card">
        <h2>Account details</h2>
        <form onSubmit={saveName} className="prof-form">
          <label className="field"><span>Display name</span>
            <input value={name} onChange={(e)=>setName(e.target.value)} required />
          </label>
          <label className="field"><span>Email</span>
            <input value={app.user.email} disabled />
          </label>
          <label className="field"><span>Signed in via</span>
            <input value={isGoogle ? 'Google' : 'Email & password'} disabled />
          </label>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save name'}</button>
        </form>
      </section>

      <section className="prof-card">
        <h2>{isGoogle ? 'Set a password' : 'Change password'}</h2>
        <p className="muted" style={subStyle}>
          {isGoogle ? 'Your account uses Google sign-in. You can optionally set a password to also sign in with email.' : 'Enter your current password and a new one.'}
        </p>
        <form onSubmit={savePw} className="prof-form">
          {!isGoogle && (
            <label className="field"><span>Current password</span>
              <input type="password" value={currentPw} onChange={(e)=>setCurrentPw(e.target.value)} required />
            </label>
          )}
          <label className="field"><span>New password</span>
            <input type="password" value={newPw} onChange={(e)=>setNewPw(e.target.value)} required minLength={6} />
          </label>
          <label className="field"><span>Confirm new password</span>
            <input type="password" value={newPw2} onChange={(e)=>setNewPw2(e.target.value)} required minLength={6} />
          </label>
          {err && <div className="af-err">{err}</div>}
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button>
        </form>
      </section>
    </main>
  );
}

const pageStyle = { padding: '32px 16px 80px', maxWidth: 720 };
const subStyle = { marginTop: -4, marginBottom: 14 };
