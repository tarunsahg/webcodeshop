import { db, genKey, genGiftCard } from '@/lib/db';
import { requireUser, getSessionUser, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';
import { sendOrderReceipt, sendOrderPending } from '@/lib/mailer';
import crypto from 'crypto';

function expandOrder(o) {
  const items = db().prepare('SELECT oi.*, p.kind as product_kind, p.file_url as product_file_url FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?').all(o.id);
  const keys = db().prepare('SELECT lk.*, p.kind as product_kind FROM license_keys lk LEFT JOIN products p ON p.id=lk.product_id WHERE lk.order_id=?').all(o.id);
  return {
    id: o.id, status: o.status, total: o.total, subtotal: o.subtotal, discount: o.discount, coupon: o.coupon_code,
    name: o.customer_name, email: o.customer_email, phone: o.customer_phone, userId: o.user_id, date: o.placed_at,
    paymentMethod: o.payment_method, txnId: o.txn_id, adminMessage: o.admin_message,
    items: items.map(i => ({ pid: i.product_id, name: i.product_name, qty: i.qty, price: i.price, kind: i.product_kind === 'giftcard' ? 'giftcard' : 'code', fileUrl: i.product_file_url || '' })),
    keys: keys.map(k => ({ pid: k.product_id, name: k.product_name, code: k.code, kind: (k.kind === 'giftcard' || k.product_kind === 'giftcard') ? 'giftcard' : 'code', pin: k.pin || null, value: k.value || null, deliveredAt: k.delivered_at })),
  };
}

export async function GET() {
  return handle(async () => {
    const u = getSessionUser();
    if (!u) return ok({ orders: [] });
    let rows;
    if (u.role === 'admin') {
      rows = db().prepare('SELECT * FROM orders ORDER BY placed_at DESC').all();
    } else {
      rows = db().prepare('SELECT * FROM orders WHERE user_id=? OR customer_email=? ORDER BY placed_at DESC').all(u.id, u.email);
    }
    return ok({ orders: rows.map(expandOrder) });
  });
}

export async function POST(req) {
  return handle(async () => {
    const u = requireUser();
    const { items, couponCode, paymentMethod, txnId, phone } = await parseJSON(req);
    if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'Cart is empty');
    const method = typeof paymentMethod === 'string' ? paymentMethod : 'card';
    const isManual = method === 'upi';
    if (isManual && !(txnId && String(txnId).trim())) throw httpError(400, 'Please enter your UPI transaction ID');
    const status = isManual ? 'pending' : 'completed';

    const products = db().prepare(`SELECT * FROM products WHERE id IN (${items.map(() => '?').join(',')})`).all(...items.map(i => i.id));
    const pmap = Object.fromEntries(products.map(p => [p.id, p]));

    let subtotal = 0;
    const enriched = items.map(it => {
      const p = pmap[it.id];
      if (!p) throw httpError(400, 'Product not found: ' + it.id);
      const qty = Math.max(1, Math.min(99, parseInt(it.qty) || 1));
      subtotal += p.price * qty;
      return { pid: p.id, name: p.name, price: p.price, qty, kind: p.kind === 'giftcard' ? 'giftcard' : 'code' };
    });

    let discount = 0;
    let appliedCode = null;
    if (couponCode) {
      const c = db().prepare('SELECT * FROM coupons WHERE code=? AND active=1').get(couponCode.toUpperCase().trim());
      if (!c) throw httpError(400, 'Invalid or inactive coupon');
      if (c.type === 'percent') discount = subtotal * (c.value / 100);
      else discount = Math.min(subtotal, c.value);
      appliedCode = c.code;
      db().prepare('UPDATE coupons SET uses=uses+1 WHERE id=?').run(c.id);
    }
    const total = Math.max(0, +(subtotal - discount).toFixed(2));

    const orderId = 'INV-' + (1100 + db().prepare('SELECT COUNT(*) as c FROM orders').get().c);
    const tx = db().transaction(() => {
      db().prepare('INSERT INTO orders (id,user_id,customer_name,customer_email,customer_phone,status,subtotal,discount,total,coupon_code,payment_method,txn_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(
        orderId, u.id, u.name, u.email, phone ? String(phone).trim() : null, status, subtotal, discount, total, appliedCode, method, isManual ? String(txnId).trim() : null,
      );
      const insItem = db().prepare('INSERT INTO order_items (order_id,product_id,product_name,qty,price) VALUES (?,?,?,?,?)');
      for (const it of enriched) insItem.run(orderId, it.pid, it.name, it.qty, it.price);
      if (status === 'completed') {
        const insKey = db().prepare('INSERT INTO license_keys (order_id,product_id,product_name,code,kind,pin,value) VALUES (?,?,?,?,?,?,?)');
        const psales = db().prepare('UPDATE products SET sales=sales+? WHERE id=?');
        for (const it of enriched) {
          for (let i = 0; i < it.qty; i++) {
            if (it.kind === 'giftcard') {
              const g = genGiftCard();
              insKey.run(orderId, it.pid, it.name, g.code, 'giftcard', g.pin, it.price);
            } else {
              insKey.run(orderId, it.pid, it.name, genKey(it.pid), 'code', null, null);
            }
          }
          psales.run(it.qty, it.pid);
        }
      }
    });
    tx();

    const o = db().prepare('SELECT * FROM orders WHERE id=?').get(orderId);
    const expanded = expandOrder(o);
    if (status === 'completed') sendOrderReceipt(expanded).catch(() => {});
    else if (status === 'pending') sendOrderPending(expanded).catch(() => {});
    return ok({ order: expandOrder(o) }, { status: 201 });
  });
}
