import { db, hashPassword } from '@/lib/db';
import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

function customerRow(id) {
  return db().prepare(`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id OR o.customer_email = u.email) as orders,
      (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.user_id = u.id OR o.customer_email = u.email) as spent
    FROM users u WHERE u.id=?
  `).get(id);
}

export async function PATCH(req, { params }) {
  return handle(async () => {
    requireAdmin();
    const u = db().prepare('SELECT id, role FROM users WHERE id=?').get(params.id);
    if (!u) throw httpError(404, 'User not found');
    const { name, password } = await parseJSON(req);
    const updates = [];
    const vals = [];
    if (typeof name === 'string' && name.trim()) { updates.push('name=?'); vals.push(name.trim()); }
    if (password !== undefined && password !== null && password !== '') {
      if (String(password).length < 6) throw httpError(400, 'Password must be at least 6 characters');
      updates.push('password=?'); vals.push(hashPassword(String(password)));
    }
    if (updates.length === 0) throw httpError(400, 'Enter a new name or password to update');
    vals.push(params.id);
    db().prepare('UPDATE users SET ' + updates.join(', ') + ' WHERE id=?').run(...vals);
    return ok({ user: customerRow(params.id) });
  });
}

export async function DELETE(_req, { params }) {
  return handle(async () => {
    requireAdmin();
    const u = db().prepare('SELECT id,role FROM users WHERE id=?').get(params.id);
    if (!u) throw httpError(404, 'User not found');
    if (u.role === 'admin') throw httpError(400, 'Cannot delete admin user');
    db().prepare('DELETE FROM users WHERE id=?').run(params.id);
    return ok({ success: true });
  });
}
