import { db } from '@/lib/db';
import { getSeoSettings, siteBaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default function sitemap() {
  const s = getSeoSettings();
  const base = siteBaseUrl(s);
  if (s.seoSitemapEnabled === 'off') return [];
  const now = new Date();
  const routes = ['', '/shop', '/deals', '/about', '/help', '/terms', '/privacy', '/cookies'];
  const entries = routes.map((r) => ({
    url: base + (r || '/'),
    lastModified: now,
    changeFrequency: r === '' ? 'daily' : 'weekly',
    priority: r === '' ? 1 : 0.7,
  }));
  try {
    const rows = db().prepare('SELECT id FROM products').all();
    for (const p of rows) {
      entries.push({ url: base + '/product/' + p.id, lastModified: now, changeFrequency: 'weekly', priority: 0.8 });
    }
  } catch (e) {}
  return entries;
}
