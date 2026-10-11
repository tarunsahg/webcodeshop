import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';

export async function GET() {
  return handle(async () => {
    requireAdmin();
    const rows = db().prepare(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id OR o.customer_email = u.email) as orders,
        (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.user_id = u.id OR o.customer_email = u.email) as spent
      FROM users u
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC
    `).all();
    return ok({ users: rows });
  });
}
