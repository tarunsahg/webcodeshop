import { db } from '@/lib/db';
import { requireUser, getSessionUser, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

function recompute(productId) {
  const r = db().prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id=?').get(productId);
  db().prepare('UPDATE products SET rating=?, reviews=? WHERE id=?').run(
    Math.round((r.avg || 0) * 10) / 10, r.count || 0, productId
  );
}

export async function GET(req) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) throw httpError(400, 'productId required');
    const rows = db().prepare('SELECT id,product_id as productId,user_id as userId,name,rating,body,created_at as createdAt FROM reviews WHERE product_id=? ORDER BY created_at DESC').all(productId);
    const stats = db().prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id=?').get(productId);
    return ok({ reviews: rows, average: stats.avg || 0, count: stats.count || 0 });
  });
}

export async function POST(req) {
  return handle(async () => {
    const me = requireUser();
    const { productId, rating, body } = await parseJSON(req);
    if (!productId) throw httpError(400, 'productId required');
    const r = parseInt(rating);
    if (!(r >= 1 && r <= 5)) throw httpError(400, 'Rating must be 1–5');
    const p = db().prepare('SELECT id FROM products WHERE id=?').get(productId);
    if (!p) throw httpError(404, 'Product not found');
    const existing = db().prepare('SELECT id FROM reviews WHERE product_id=? AND user_id=?').get(productId, me.id);
    if (existing) {
      db().prepare('UPDATE reviews SET rating=?, body=? WHERE id=?').run(r, String(body || ''), existing.id);
    } else {
      db().prepare('INSERT INTO reviews (product_id,user_id,name,rating,body) VALUES (?,?,?,?,?)').run(productId, me.id, me.name, r, String(body || ''));
    }
    recompute(productId);
    return ok({ saved: true });
  });
}

export async function DELETE(req) {
  return handle(async () => {
    const me = requireUser();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) throw httpError(400, 'productId required');
    db().prepare('DELETE FROM reviews WHERE product_id=? AND user_id=?').run(productId, me.id);
    recompute(productId);
    return ok({ deleted: true });
  });
}
