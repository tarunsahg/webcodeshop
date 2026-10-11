'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';

const DEF = {
  seoSiteName: 'WebCodeShop',
  seoTitle: 'WebCodeShop — Code. Templates. Scripts. Solutions.',
  seoTitleTemplate: '%s — WebCodeShop',
  seoDescription: 'Production-ready PHP & HTML software, modern JS apps, and instant digital gift cards. Delivered in seconds with lifetime updates.',
  seoKeywords: 'php scripts, html templates, source code, gift cards, web software',
  seoCanonicalBase: '',
  seoOgImage: '/og-image.png',
  seoTwitterCard: 'summary_large_image',
  seoTwitterHandle: '',
  seoSocialLinks: '',
  seoRobotsIndex: 'index',
  seoRobotsFollow: 'follow',
  seoSitemapEnabled: 'on',
  seoGoogleVerification: '',
  seoBingVerification: '',
  seoOrgName: 'WebCodeShop',
  seoOrgLogo: '/logo-icon.png',
};

const SECTIONS = [
  {
    id: 'general', tag: 'Titles & description', title: 'General meta',
    desc: 'The core title and description search engines show. Keep titles under ~60 characters and descriptions under ~160.',
    fields: [
      { k: 'seoSiteName', label: 'Site name', ph: 'WebCodeShop' },
      { k: 'seoTitle', label: 'Homepage / default title', ph: 'WebCodeShop — Code. Templates. Scripts.' },
      { k: 'seoTitleTemplate', label: 'Title template', ph: '%s — WebCodeShop', hint: 'Used on every other page. %s is replaced with that page\u2019s title.' },
      { k: 'seoDescription', label: 'Meta description', ph: 'A short, compelling summary of your store…', area: true },
      { k: 'seoKeywords', label: 'Focus keywords', ph: 'php scripts, html templates, gift cards' },
      { k: 'seoCanonicalBase', label: 'Site URL (canonical base)', ph: 'https://www.yoursite.com', hint: 'Used for canonical URLs, sitemap, robots and social tags.' },
    ],
  },
  {
    id: 'social', tag: 'Open Graph / Twitter', title: 'Social sharing',
    desc: 'Controls how your links look when shared on social media and chat apps.',
    fields: [
      { k: 'seoOgImage', label: 'Default share image URL', ph: '/og-image.png', hint: 'Recommended size 1200×630px.' },
      { k: 'seoTwitterCard', label: 'Twitter card type', select: ['summary_large_image', 'summary'] },
      { k: 'seoTwitterHandle', label: 'Twitter / X handle', ph: '@yourbrand' },
      { k: 'seoSocialLinks', label: 'Social profile URLs', ph: 'https://twitter.com/you\nhttps://facebook.com/you', area: true, hint: 'One URL per line — added to your Organization structured data.' },
    ],
  },
  {
    id: 'indexing', tag: 'Crawl control', title: 'Indexing & sitemap',
    desc: 'Tell search engines what they may crawl and index.',
    fields: [
      { k: 'seoRobotsIndex', label: 'Search engine indexing', select: ['index', 'noindex'] },
      { k: 'seoRobotsFollow', label: 'Link following', select: ['follow', 'nofollow'] },
      { k: 'seoSitemapEnabled', label: 'XML sitemap', select: ['on', 'off'], hint: 'Served at /sitemap.xml and referenced from /robots.txt.' },
    ],
  },
  {
    id: 'verify', tag: 'Verification', title: 'Search console verification',
    desc: 'Paste the verification codes from Google Search Console and Bing Webmaster Tools.',
    fields: [
      { k: 'seoGoogleVerification', label: 'Google verification code', ph: 'content value from the meta tag' },
      { k: 'seoBingVerification', label: 'Bing verification code', ph: 'msvalidate.01 value' },
    ],
  },
  {
    id: 'schema', tag: 'Schema.org', title: 'Structured data',
    desc: 'Powers rich results — your Organization details and the site search box.',
    fields: [
      { k: 'seoOrgName', label: 'Organization name', ph: 'WebCodeShop' },
      { k: 'seoOrgLogo', label: 'Organization logo URL', ph: '/logo-icon.png' },
    ],
  },
];

export default function AdminSeo() {
  const app = useApp();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (!app?.settings) return;
    const seo = {};
    Object.keys(app.settings).forEach((k) => { if (k.startsWith('seo')) seo[k] = app.settings[k]; });
    setDraft({ ...DEF, ...seo });
  }, [app?.settings]);

  useEffect(() => { if (typeof window !== 'undefined') setOrigin(window.location.origin); }, []);

  if (!app || !app.admin || !draft) return null;

  const set = (k, v) => { setDraft((d) => ({ ...d, [k]: v })); setSaved(false); };
  const save = async () => {
    setSaving(true);
    const patch = {};
    Object.keys(DEF).forEach((k) => { patch[k] = typeof draft[k] === 'string' ? draft[k].trim() : (draft[k] == null ? '' : draft[k]); });
    await app.updateSettings(patch);
    setSaving(false); setSaved(true);
  };

  const prevTitle = draft.seoTitle || DEF.seoTitle;
  const prevUrl = (draft.seoCanonicalBase || 'https://www.yoursite.com').replace('https://', '').replace('http://', '');
  const prevDesc = draft.seoDescription || DEF.seoDescription;
  let siteBase = (draft.seoCanonicalBase || '').trim();
  while (siteBase.endsWith('/')) siteBase = siteBase.slice(0, -1);
  if (!siteBase) siteBase = origin;

  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1>SEO</h1>
          <p className="muted">A complete, Rank Math-style SEO toolkit. Edit titles, social cards, indexing rules, verification and structured data — changes apply across the whole site instantly.</p>
        </div>
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save SEO settings'}</button>
      </header>

      <div className="seo-preview">
        <div className="seo-prev-lbl">Google preview</div>
        <p className="seo-prev-url">{prevUrl}</p>
        <p className="seo-prev-title">{prevTitle}</p>
        <p className="seo-prev-desc">{prevDesc}</p>
      </div>

      {siteBase && (
        <div className="seo-urls">
          <div className="seo-prev-lbl">Live SEO files</div>
          <ul>
            <li>Sitemap (all pages): <a href={siteBase + '/sitemap.xml'} target="_blank" rel="noreferrer">{siteBase}/sitemap.xml</a></li>
            <li>Robots: <a href={siteBase + '/robots.txt'} target="_blank" rel="noreferrer">{siteBase}/robots.txt</a></li>
          </ul>
          <p className="seo-hint">Submit the sitemap URL to Google Search Console &amp; Bing Webmaster Tools — it updates automatically as you add products and pages.</p>
        </div>
      )}

      <div className="intg-grid">
        {SECTIONS.map((g) => (
          <section key={g.id} className="intg-card seo-card">
            <div className="intg-card-head">
              <div>
                <span className="intg-tag">{g.tag}</span>
                <h3>{g.title}</h3>
              </div>
            </div>
            <p className="intg-desc">{g.desc}</p>
            <div>
              {g.fields.map((f) => (
                <div key={f.k} className="field">
                  <label>{f.label}</label>
                  {f.select ? (
                    <select value={draft[f.k] || ''} onChange={(e) => set(f.k, e.target.value)}>
                      {f.select.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.area ? (
                    <textarea rows={3} value={draft[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} placeholder={f.ph} />
                  ) : (
                    <input value={draft[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} placeholder={f.ph} />
                  )}
                  {f.hint && <div className="seo-hint">{f.hint}</div>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="seo-save-bar">
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save SEO settings'}</button>
        {saved && <span className="seo-saved">✓ Saved — your SEO settings are live.</span>}
      </div>
    </>
  );
}
