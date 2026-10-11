import { db } from '@/lib/db';
import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

export async function GET() {
  return handle(async () => {
    requireAdmin();
    const rows = db().prepare('SELECT id,code,type,value,active,uses,created_at FROM coupons ORDER BY created_at DESC').all();
    return ok({ coupons: rows.map(c => ({ ...c, active: !!c.active })) });
  });
}

export async function POST(req) {
  return handle(async () => {
    requireAdmin();
    const { code, type, value, active } = await parseJSON(req);
    if (!code || !type || value == null) throw httpError(400, 'code, type, value required');
    if (!['percent', 'fixed'].includes(type)) throw httpError(400, 'type must be percent or fixed');
    const c = code.toUpperCase().trim();
    const exists = db().prepare('SELECT id FROM coupons WHERE code=?').get(c);
    if (exists) throw httpError(409, 'Coupon code already exists');
    const info = db().prepare('INSERT INTO coupons (code,type,value,active) VALUES (?,?,?,?)').run(c, type, value, active ? 1 : 0);
    const row = db().prepare('SELECT id,code,type,value,active,uses,created_at FROM coupons WHERE id=?').get(info.lastInsertRowid);
    return ok({ coupon: { ...row, active: !!row.active } }, { status: 201 });
  });
}
