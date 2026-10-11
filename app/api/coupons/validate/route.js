import { db } from '@/lib/db';
import { httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

export async function POST(req) {
  return handle(async () => {
    const { code, subtotal } = await parseJSON(req);
    if (!code) throw httpError(400, 'code required');
    const c = db().prepare('SELECT * FROM coupons WHERE code=? AND active=1').get(String(code).toUpperCase().trim());
    if (!c) throw httpError(400, 'Invalid or inactive coupon');
    const sub = Number(subtotal) || 0;
    const discount = c.type === 'percent' ? sub * (c.value / 100) : Math.min(sub, c.value);
    return ok({ code: c.code, type: c.type, value: c.value, discount: +discount.toFixed(2) });
  });
}
