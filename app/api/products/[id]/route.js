import { db } from '@/lib/db';
import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

function rowToProduct(r) {
  if (!r) return null;
  let images = [];
  try { images = r.images ? JSON.parse(r.images) : []; } catch { images = []; }
  if (!Array.isArray(images)) images = [];
  images = images.filter(Boolean);
  if (!images.length && r.image) images = [r.image];
  let features = [];
  try { features = r.features ? JSON.parse(r.features) : []; } catch { features = []; }
  if (!Array.isArray(features)) features = [];
  let specs = [];
  try { specs = r.specs ? JSON.parse(r.specs) : []; } catch { specs = []; }
  if (!Array.isArray(specs)) specs = [];
  return {
    id: r.id, name: r.name, cat: r.cat, price: r.price, old: r.old_price || 0,
    icon: r.icon, image: images[0] || r.image || '', images, gr: r.gradient, rating: r.rating, reviews: r.reviews, sales: r.sales,
    desc: r.description, tag: r.tag || '', tagType: r.tag_type || '', features, specs, trending: !!r.trending, newArrival: !!r.new_arrival, onDeal: !!r.on_deal, kind: r.kind || 'code', fileUrl: r.file_url || '', fileName: r.file_name || '', createdAt: r.created_at,
  };
}

function normImages(p) {
  let imgs = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
  return imgs.filter(Boolean).slice(0, 5);
}

function normFeatures(p) {
  const f = Array.isArray(p.features) ? p.features : [];
  return f.map((x) => String(x == null ? '' : x).trim()).filter(Boolean).slice(0, 20);
}

function normSpecs(p) {
  const s = Array.isArray(p.specs) ? p.specs : [];
  return s.map((x) => ({ label: String((x && x.label) || '').trim(), value: String((x && x.value) || '').trim() }))
          .filter((x) => x.label || x.value).slice(0, 20);
}

export async function GET(_req, { params }) {
  return handle(async () => {
    const r = db().prepare('SELECT * FROM products WHERE id=?').get(params.id);
    if (!r) throw httpError(404, 'Product not found');
    return ok({ product: rowToProduct(r) });
  });
}

export async function PUT(req, { params }) {
  return handle(async () => {
    requireAdmin();
    const p = await parseJSON(req);
    const exists = db().prepare('SELECT id FROM products WHERE id=?').get(params.id);
    if (!exists) throw httpError(404, 'Product not found');
    const imgs = normImages(p);
    db().prepare('UPDATE products SET name=?,cat=?,price=?,old_price=?,icon=?,image=?,gradient=?,rating=?,reviews=?,sales=?,description=?,tag=?,tag_type=?,images=?,features=?,specs=?,trending=?,new_arrival=?,on_deal=?,kind=?,file_url=?,file_name=? WHERE id=?').run(
      p.name, p.cat, p.price, p.old || null, p.icon, imgs[0] || null, p.gr,
      p.rating || 0, p.reviews || 0, p.sales || 0, p.desc || '', p.tag || null, p.tagType || null, JSON.stringify(imgs), JSON.stringify(normFeatures(p)), JSON.stringify(normSpecs(p)), p.trending ? 1 : 0, p.newArrival ? 1 : 0, p.onDeal ? 1 : 0, p.kind === 'giftcard' ? 'giftcard' : 'code', p.kind === 'giftcard' ? null : (p.fileUrl || null), p.kind === 'giftcard' ? null : (p.fileName || null),
      params.id,
    );
    const r = db().prepare('SELECT * FROM products WHERE id=?').get(params.id);
    return ok({ product: rowToProduct(r) });
  });
}

export async function DELETE(_req, { params }) {
  return handle(async () => {
    requireAdmin();
    db().prepare('DELETE FROM products WHERE id=?').run(params.id);
    return ok({ success: true });
  });
}
