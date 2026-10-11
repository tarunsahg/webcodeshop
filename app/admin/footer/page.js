'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { SOCIAL_PLATFORMS, normalizeFooterSocials } from '@/lib/socials';

function Icon({ d }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>;
}

const META = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.id, p]));

export default function AdminFooter() {
  const app = useApp();
  const [socials, setSocials] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!app || !app.settings) return;
    setSocials(normalizeFooterSocials(app.settings.footerSocials));
  }, [app && app.settings]);

  if (!app || !app.admin) return null;

  const setUrl = (id, url) => setSocials((s) => s.map((x) => (x.id === id ? { ...x, url } : x)));
  const toggle = (id) => setSocials((s) => s.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)));

  const save = async () => {
    setSaving(true);
    await app.updateSettings({
      footerSocials: socials.map((s) => ({ id: s.id, url: (s.url || '').trim(), enabled: !!s.enabled })),
      footerLinks: [],
    });
    setSaving(false);
  };

  const liveCount = socials.filter((s) => s.enabled && (s.url || '').trim()).length;

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Footer</h1>
          <p className="sub">Switch on the social networks you use, paste each profile URL, and save. Only networks that are turned on and have a URL appear in the footer. {liveCount} live right now.</p>
        </div>
        <div style={rowStyle}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save & publish'}</button>
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="ftr-sec-title">Social networks</h3>
        <p className="muted ftr-sec-sub">Every icon is pre-loaded — just toggle the ones you want and add the link. External links open in a new tab.</p>
        <div className="ftr-soc-list">
          {socials.map((s) => {
            const m = META[s.id] || { label: s.id, placeholder: '', d: '' };
            return (
              <div className={'ftr-soc-row' + (s.enabled ? ' on' : '')} key={s.id}>
                <span className="ftr-soc-ic"><Icon d={m.d} /></span>
                <div className="ftr-soc-main">
                  <label className="ftr-soc-label">{m.label}</label>
                  <input value={s.url} placeholder={m.placeholder} onChange={(e) => setUrl(s.id, e.target.value)} />
                </div>
                <label className="switch" title={s.enabled ? 'Shown in footer' : 'Hidden from footer'}>
                  <input type="checkbox" checked={!!s.enabled} onChange={() => toggle(s.id)} />
                  <span className="switch-slider" />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const rowStyle = { display: 'flex', gap: 10 };
