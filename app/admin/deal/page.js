'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/Providers';

const DEAL_DEFAULTS = {
  dealEnabled: 'on',
  dealPageName: 'Deals',
  dealTag: '🎁 Limited time',
  dealTitle: 'Save 25% on bestsellers',
  dealCode: 'WCS25',
  dealBig: '25%',
  dealSmall: 'OFF',
  dealCta: 'Shop deals',
  dealLink: '/shop',
};

export default function AdminDeal() {
  const app = useApp();
  const [draft, setDraft] = useState(null);
  useEffect(() => { if (app?.settings) setDraft({ ...DEAL_DEFAULTS, ...app.settings }); }, [app?.settings]);
  if (!app || !app.admin || !draft) return null;

  const set = (k, v) => setDraft({ ...draft, [k]: v });
  const save = () => app.updateSettings({
    dealEnabled: draft.dealEnabled,
    dealPageName: draft.dealPageName,
    dealTag: draft.dealTag,
    dealTitle: draft.dealTitle,
    dealCode: draft.dealCode,
    dealBig: draft.dealBig,
    dealSmall: draft.dealSmall,
    dealCta: draft.dealCta,
    dealLink: draft.dealLink,
  });
  const reset = () => setDraft({ ...DEAL_DEFAULTS, ...app.settings });
  const on = (draft.dealEnabled || 'on') === 'on';

  return (
    <>
      <div className="adm-head">
        <div><h1>Deal banner</h1><p className="sub">Edit the limited-time promo shown on the mobile home page.</p></div>
        <div style={rowStyle}>
          <Link href="/" target="_blank" className="btn btn-soft">View live ↗</Link>
          <button className="btn btn-ghost" onClick={reset}>Reset</button>
          <button className="btn btn-primary" onClick={save}>Save &amp; publish</button>
        </div>
      </div>

      <div className="deal-edit-grid">
        <div className="card card-pad">
          <p className="muted" style={noteStyle}>📱 This banner appears on mobile only, between the categories and the trusted-by row.</p>
          <div className="set-grid">
            <div className="set-row">
              <label style={toggleLabel}>
                <input type="checkbox" checked={on} onChange={(e) => set('dealEnabled', e.target.checked ? 'on' : 'off')} />
                <span>Show the deal banner</span>
              </label>
            </div>
            <div className="set-row">
              <label>Deal page name<span className="h">Title of the public deals page and its menu link.</span></label>
              <input value={draft.dealPageName || ''} onChange={(e) => set('dealPageName', e.target.value)} />
            </div>
            <div className="set-row">
              <label>Tag<span className="h">Small pill above the title.</span></label>
              <input value={draft.dealTag || ''} onChange={(e) => set('dealTag', e.target.value)} />
            </div>
            <div className="set-row">
              <label>Headline<span className="h">e.g. Save 25% on bestsellers.</span></label>
              <input value={draft.dealTitle || ''} onChange={(e) => set('dealTitle', e.target.value)} />
            </div>
            <div className="set-row">
              <label>Coupon code<span className="h">Highlighted in the banner.</span></label>
              <input value={draft.dealCode || ''} onChange={(e) => set('dealCode', e.target.value)} />
            </div>
            <div className="set-row">
              <label>Badge — discount %<span className="h">Big text in the circular badge (type it manually, e.g. 25%).</span></label>
              <input value={draft.dealBig || ''} onChange={(e) => set('dealBig', e.target.value)} />
            </div>
            <div className="set-row">
              <label>Badge — caption<span className="h">Small text under the % (e.g. OFF).</span></label>
              <input value={draft.dealSmall || ''} onChange={(e) => set('dealSmall', e.target.value)} />
            </div>
            <div className="set-row">
              <label>Button text<span className="h">Arrow is added automatically.</span></label>
              <input value={draft.dealCta || ''} onChange={(e) => set('dealCta', e.target.value)} />
            </div>
            <div className="set-row">
              <label>Button link<span className="h">e.g. /shop or /shop?c=php.</span></label>
              <input value={draft.dealLink || ''} onChange={(e) => set('dealLink', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card card-pad deal-pv-card">
          <div className="deal-pv-label">Live preview</div>
          {on ? (
            <div className="dpv-phone">
              <div className="dpv-deal">
                <div className="dpv-glow"/>
                <div className="dpv-body">
                  <span className="dpv-tag">{draft.dealTag || '🎁 Limited time'}</span>
                  <h3>{draft.dealTitle || 'Save 25% on bestsellers'}</h3>
                  <p>Use code <b>{draft.dealCode || 'WCS25'}</b> at checkout</p>
                  <span className="dpv-btn">{draft.dealCta || 'Shop deals'} →</span>
                </div>
                <div className="dpv-art"><span>{draft.dealBig || '25%'}</span><small>{draft.dealSmall || 'OFF'}</small></div>
              </div>
            </div>
          ) : (
            <div className="dpv-off">Banner is hidden. Turn it on to preview.</div>
          )}
        </div>
      </div>
    </>
  );
}
const rowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const noteStyle = { margin: '0 0 16px', fontSize: 13.5 };
const toggleLabel = { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600 };
