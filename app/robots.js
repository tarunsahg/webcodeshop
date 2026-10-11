import { getSeoSettings, siteBaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default function robots() {
  const s = getSeoSettings();
  const base = siteBaseUrl(s);
  const noindex = s.seoRobotsIndex === 'noindex';
  const out = {
    rules: noindex
      ? [{ userAgent: '*', disallow: '/' }]
      : [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/account', '/checkout', '/cart', '/wishlist'] }],
    host: base,
  };
  if (s.seoSitemapEnabled !== 'off') out.sitemap = base + '/sitemap.xml';
  return out;
}
