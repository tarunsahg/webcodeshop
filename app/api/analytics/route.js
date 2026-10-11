import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';

export async function GET() {
  return handle(async () => {
    requireAdmin();
    const d = db();
    const totals = d.prepare(`SELECT
      (SELECT COALESCE(SUM(total),0) FROM orders WHERE status='completed') as revenue,
      (SELECT COUNT(*) FROM orders) as orders,
      (SELECT COUNT(*) FROM users WHERE role='customer') as customers,
      (SELECT COUNT(*) FROM products) as products,
      (SELECT COUNT(*) FROM license_keys) as keys,
      (SELECT COUNT(*) FROM coupons WHERE active=1) as activeCoupons
    `).get();

    const daily = d.prepare(`
      SELECT date(placed_at) as day, COUNT(*) as count, COALESCE(SUM(total),0) as revenue
      FROM orders
      WHERE placed_at >= date('now','-7 days')
      GROUP BY date(placed_at)
      ORDER BY day ASC
    `).all();

    const topProducts = d.prepare(`
      SELECT p.id, p.name, p.icon, p.gradient, p.price, p.sales,
        (SELECT COALESCE(SUM(oi.qty * oi.price),0) FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.product_id=p.id AND o.status='completed') as revenue
      FROM products p ORDER BY revenue DESC LIMIT 5
    `).all();

    const recentOrders = d.prepare(`
      SELECT id, customer_name, customer_email, total, status, placed_at
      FROM orders ORDER BY placed_at DESC LIMIT 8
    `).all();

    const statusBreakdown = d.prepare(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`).all();

    return ok({ totals, daily, topProducts, recentOrders, statusBreakdown });
  });
}
