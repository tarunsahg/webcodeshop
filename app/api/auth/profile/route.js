import { db, hashPassword, verifyPassword } from '@/lib/db';
import { requireUser, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

export async function PATCH(req) {
  return handle(async () => {
    const me = requireUser();
    const body = await parseJSON(req);
    const updates = [];
    const params = [];

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.push('name=?'); params.push(body.name.trim());
    }
    if (typeof body.avatar === 'string') {
      updates.push('avatar=?'); params.push(body.avatar || null);
    }
    if (body.newPassword) {
      if (String(body.newPassword).length < 6) throw httpError(400, 'Password must be at least 6 characters');
      // If user has a real password (not OAuth-only), require currentPassword.
      const row = db().prepare('SELECT password,provider FROM users WHERE id=?').get(me.id);
      const hasLocalPw = row.password && row.password !== '' && row.provider !== 'google';
      if (hasLocalPw) {
        if (!body.currentPassword || !verifyPassword(body.currentPassword, row.password)) {
          throw httpError(400, 'Current password is incorrect');
        }
      }
      updates.push('password=?'); params.push(hashPassword(body.newPassword));
    }

    if (updates.length === 0) throw httpError(400, 'Nothing to update');
    params.push(me.id);
    db().prepare(`UPDATE users SET ${updates.join(', ')} WHERE id=?`).run(...params);
    const user = db().prepare('SELECT id,name,email,role,avatar,provider,created_at FROM users WHERE id=?').get(me.id);
    return ok({ user });
  });
}
