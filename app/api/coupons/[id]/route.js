import { db } from '@/lib/db';
import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

export async function PATCH(req, { params }) {
  return handle(async () => {
    requireAdmin();
    const body = await parseJSON(req);
    const c = db().prepare('SELECT * FROM coupons WHERE id=?').get(params.id);
    if (!c) throw httpError(404, 'Coupon not found');
    const fields = [];
    const vals = [];
    if (body.type) { fields.push('type=?'); vals.push(body.type); }
    if (body.value != null) { fields.push('value=?'); vals.push(body.value); }
    if (body.active != null) { fields.push('active=?'); vals.push(body.active ? 1 : 0); }
    if (body.code) { fields.push('code=?'); vals.push(body.code.toUpperCase().trim()); }
    if (!fields.length) return ok({ coupon: { ...c, active: !!c.active } });
    vals.push(params.id);
    db().prepare(`UPDATE coupons SET ${fields.join(',')} WHERE id=?`).run(...vals);
    const row = db().prepare('SELECT * FROM coupons WHERE id=?').get(params.id);
    return ok({ coupon: { ...row, active: !!row.active } });
  });
}

export async function DELETE(_req, { params }) {
  return handle(async () => {
    requireAdmin();
    db().prepare('DELETE FROM coupons WHERE id=?').run(params.id);
    return ok({ success: true });
  });
}
