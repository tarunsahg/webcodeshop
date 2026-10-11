import { db } from '@/lib/db';

const DEFAULTS = {
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

export function getSeoSettings() {
  const out = { ...DEFAULTS };
  try {
    const rows = db().prepare("SELECT key,value FROM settings WHERE key LIKE 'seo%'").all();
    for (const r of rows) {
      let v = r.value;
      try { v = JSON.parse(r.value); } catch (e) {}
      if (v !== undefined && v !== null && String(v).length) out[r.key] = v;
    }
  } catch (e) {}
  return out;
}

export function siteBaseUrl(seo) {
  const s = seo || getSeoSettings();
  let base = (s.seoCanonicalBase || process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://webcodeshop.com').toString().trim();
  while (base.endsWith('/')) base = base.slice(0, -1);
  if (base && !base.startsWith('http://') && !base.startsWith('https://')) base = 'https://' + base;
  if (!base) base = 'https://webcodeshop.com';
  return base;
}

export function buildRootMetadata() {
  const s = getSeoSettings();
  const base = siteBaseUrl(s);
  const doIndex = s.seoRobotsIndex !== 'noindex';
  const doFollow = s.seoRobotsFollow !== 'nofollow';
  const keywords = String(s.seoKeywords || '').split(',').map((k) => k.trim()).filter(Boolean);
  const template = (s.seoTitleTemplate && s.seoTitleTemplate.includes('%s')) ? s.seoTitleTemplate : '%s';
  const md = {
    metadataBase: new URL(base),
    applicationName: s.seoSiteName,
    title: { default: s.seoTitle, template },
    description: s.seoDescription,
    keywords,
    alternates: { canonical: '/' },
    robots: {
      index: doIndex,
      follow: doFollow,
      googleBot: { index: doIndex, follow: doFollow, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    openGraph: {
      type: 'website',
      url: '/',
      siteName: s.seoSiteName,
      title: s.seoTitle,
      description: s.seoDescription,
      images: [{ url: s.seoOgImage, width: 1200, height: 630, alt: s.seoSiteName }],
    },
    twitter: {
      card: s.seoTwitterCard || 'summary_large_image',
      title: s.seoTitle,
      description: s.seoDescription,
      images: [s.seoOgImage],
    },
    icons: {
      icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/icon-256.png', type: 'image/png', sizes: '256x256' }],
      apple: '/apple-touch-icon.png',
      shortcut: '/favicon.ico',
    },
  };
  if (s.seoTwitterHandle) { md.twitter.site = s.seoTwitterHandle; md.twitter.creator = s.seoTwitterHandle; }
  const verification = {};
  if (s.seoGoogleVerification) verification.google = s.seoGoogleVerification;
  if (s.seoBingVerification) verification.other = { 'msvalidate.01': s.seoBingVerification };
  if (Object.keys(verification).length) md.verification = verification;
  return md;
}

export function jsonLd() {
  const s = getSeoSettings();
  const base = siteBaseUrl(s);
  const logo = String(s.seoOrgLogo || '/logo-icon.png');
  const social = String(s.seoSocialLinks || '').replace(/,/g, '\n').split('\n').map((x) => x.trim()).filter(Boolean);
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: s.seoOrgName || s.seoSiteName,
    url: base,
    logo: logo.startsWith('http') ? logo : base + logo,
  };
  if (social.length) org.sameAs = social;
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: s.seoSiteName,
    url: base,
    potentialAction: {
      '@type': 'SearchAction',
      target: base + '/shop?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
  return [org, website];
}
