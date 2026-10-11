import { db } from '@/lib/db';
import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';
import crypto from 'crypto';

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

export async function GET() {
  return handle(async () => {
    const rows = db().prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    return ok({ products: rows.map(rowToProduct) });
  });
}

export async function POST(req) {
  return handle(async () => {
    requireAdmin();
    const p = await parseJSON(req);
    if (!p.name || !p.cat || p.price == null) throw httpError(400, 'name, cat, price required');
    const id = p.id || ('p' + crypto.randomBytes(4).toString('hex'));
    const imgs = normImages(p);
    db().prepare('INSERT INTO products (id,name,cat,price,old_price,icon,image,gradient,rating,reviews,sales,description,tag,tag_type,images,features,specs,trending,new_arrival,on_deal,kind,file_url,file_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
      id, p.name, p.cat, p.price, p.old || null, p.icon || '📦', imgs[0] || null, p.gr || 'linear-gradient(135deg,#1e64ff,#0b1f4d)',
      p.rating || 0, p.reviews || 0, p.sales || 0, p.desc || '', p.tag || null, p.tagType || null, JSON.stringify(imgs), JSON.stringify(normFeatures(p)), JSON.stringify(normSpecs(p)), p.trending ? 1 : 0, p.newArrival ? 1 : 0, p.onDeal ? 1 : 0, p.kind === 'giftcard' ? 'giftcard' : 'code', p.kind === 'giftcard' ? null : (p.fileUrl || null), p.kind === 'giftcard' ? null : (p.fileName || null),
    );
    const row = db().prepare('SELECT * FROM products WHERE id=?').get(id);
    return ok({ product: rowToProduct(row) }, { status: 201 });
  });
}
