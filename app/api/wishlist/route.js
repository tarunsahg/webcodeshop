import { db } from '@/lib/db';
import { requireUser, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

export async function GET() {
  return handle(async () => {
    const me = requireUser();
    const rows = db().prepare('SELECT product_id FROM wishlist WHERE user_id=? ORDER BY added_at DESC').all(me.id);
    return ok({ productIds: rows.map(r => r.product_id) });
  });
}

export async function POST(req) {
  return handle(async () => {
    const me = requireUser();
    const { productId } = await parseJSON(req);
    if (!productId) throw httpError(400, 'productId required');
    const p = db().prepare('SELECT id FROM products WHERE id=?').get(productId);
    if (!p) throw httpError(404, 'Product not found');
    const exists = db().prepare('SELECT 1 FROM wishlist WHERE user_id=? AND product_id=?').get(me.id, productId);
    if (exists) {
      db().prepare('DELETE FROM wishlist WHERE user_id=? AND product_id=?').run(me.id, productId);
      return ok({ inWishlist: false });
    }
    db().prepare('INSERT INTO wishlist (user_id,product_id) VALUES (?,?)').run(me.id, productId);
    return ok({ inWishlist: true });
  });
}

export async function DELETE(req) {
  return handle(async () => {
    const me = requireUser();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) throw httpError(400, 'productId required');
    db().prepare('DELETE FROM wishlist WHERE user_id=? AND product_id=?').run(me.id, productId);
    return ok({ removed: true });
  });
}
