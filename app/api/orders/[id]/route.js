import { db, genKey, genGiftCard } from '@/lib/db';
import { requireAdmin, getSessionUser, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';
import { sendOrderApproved, sendOrderItemsDelivered } from '@/lib/mailer';

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

export async function GET(_req, { params }) {
  return handle(async () => {
    const u = getSessionUser();
    if (!u) throw httpError(401, 'Not authenticated');
    const o = db().prepare('SELECT * FROM orders WHERE id=?').get(params.id);
    if (!o) throw httpError(404, 'Order not found');
    if (u.role !== 'admin' && o.user_id !== u.id && o.customer_email !== u.email) throw httpError(403, 'Forbidden');
    return ok({ order: expandOrder(o) });
  });
}

export async function PATCH(req, { params }) {
  return handle(async () => {
    requireAdmin();
    const { status, message, addKey, keyName, productId, kind, pin, value, autoItem } = await parseJSON(req);
    const existing = db().prepare('SELECT * FROM orders WHERE id=?').get(params.id);
    if (!existing) throw httpError(404, 'Order not found');
    if (typeof message === 'string') {
      db().prepare('UPDATE orders SET admin_message=? WHERE id=?').run(message.trim() || null, params.id);
    }
    const deliveredKeys = [];
    if (typeof addKey === 'string' && addKey.trim()) {
      const k = kind === 'giftcard' ? 'giftcard' : 'code';
      const nm = (keyName && keyName.trim()) || (k === 'giftcard' ? 'Gift card' : 'Code');
      const pinVal = pin ? String(pin).trim() : null;
      const valVal = k === 'giftcard' ? (value || null) : null;
      db().prepare('INSERT INTO license_keys (order_id, product_id, product_name, code, kind, pin, value) VALUES (?, ?, ?, ?, ?, ?, ?)').run(params.id, productId || null, nm, addKey.trim(), k, pinVal, valVal);
      deliveredKeys.push({ name: nm, code: addKey.trim(), kind: k, pin: pinVal, value: valVal });
    }
    if (autoItem && autoItem.productId !== undefined) {
      const isGift = autoItem.kind === 'giftcard';
      if (isGift) {
        const g = genGiftCard();
        const nm = autoItem.productName || 'Gift card';
        db().prepare('INSERT INTO license_keys (order_id, product_id, product_name, code, kind, pin, value) VALUES (?, ?, ?, ?, ?, ?, ?)').run(params.id, autoItem.productId || null, nm, g.code, 'giftcard', g.pin, autoItem.value || null);
        deliveredKeys.push({ name: nm, code: g.code, kind: 'giftcard', pin: g.pin, value: autoItem.value || null });
      } else {
        const nm = autoItem.productName || 'Download';
        const codeVal = (autoItem.fileUrl && String(autoItem.fileUrl).trim()) ? String(autoItem.fileUrl).trim() : genKey(autoItem.productName || '');
        db().prepare('INSERT INTO license_keys (order_id, product_id, product_name, code, kind, pin, value) VALUES (?, ?, ?, ?, ?, ?, ?)').run(params.id, autoItem.productId || null, nm, codeVal, 'code', null, null);
        deliveredKeys.push({ name: nm, code: codeVal, kind: 'code', pin: null, value: null });
      }
    }
    if (deliveredKeys.length) {
      const oDelivered = db().prepare('SELECT * FROM orders WHERE id=?').get(params.id);
      sendOrderItemsDelivered(expandOrder(oDelivered), deliveredKeys).catch(() => {});
    }
    if (status === undefined) {
      const o0 = db().prepare('SELECT * FROM orders WHERE id=?').get(params.id);
      return ok({ order: expandOrder(o0) });
    }
    const allowed = ['pending', 'completed', 'failed'];
    if (!allowed.includes(status)) throw httpError(400, 'Invalid status');
    const tx = db().transaction(() => {
      db().prepare('UPDATE orders SET status=? WHERE id=?').run(status, params.id);
      // Manual fulfilment: approving an order no longer auto-generates keys.
      // The admin delivers keys manually via "Deliver a custom key". We only
      // record the sale so analytics stay accurate.
      if (status === 'completed' && existing.status !== 'completed') {
        const lineItems = db().prepare('SELECT * FROM order_items WHERE order_id=?').all(params.id);
        const psales = db().prepare('UPDATE products SET sales=sales+? WHERE id=?');
        for (const it of lineItems) { if (it.product_id) psales.run(it.qty, it.product_id); }
      }
    });
    tx();
    const o = db().prepare('SELECT * FROM orders WHERE id=?').get(params.id);
    if (status === 'completed' && existing.status !== 'completed') sendOrderApproved(expandOrder(o)).catch(() => {});
    return ok({ order: expandOrder(o) });
  });
}

export async function DELETE(_req, { params }) {
  return handle(async () => {
    requireAdmin();
    db().prepare('DELETE FROM orders WHERE id=?').run(params.id);
    return ok({ success: true });
  });
}
