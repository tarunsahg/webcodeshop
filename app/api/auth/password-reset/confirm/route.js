import { db, hashPassword } from '@/lib/db';
import { ok, handle, parseJSON } from '@/lib/api-utils';
import { httpError, signToken, setSessionCookie } from '@/lib/auth-server';

export async function POST(req) {
  return handle(async () => {
    const { token, password } = await parseJSON(req);
    if (!token || !password) throw httpError(400, 'Missing token or password');
    if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
    const row = db().prepare('SELECT * FROM password_resets WHERE token=?').get(token);
    if (!row) throw httpError(400, 'Invalid or expired reset link');
    if (row.used) throw httpError(400, 'Reset link already used');
    if (new Date(row.expires_at).getTime() < Date.now()) throw httpError(400, 'Reset link expired');
    db().prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(password), row.user_id);
    db().prepare('UPDATE password_resets SET used=1 WHERE token=?').run(token);
    const user = db().prepare('SELECT id,name,email,role FROM users WHERE id=?').get(row.user_id);
    const res = ok({ user });
    setSessionCookie(res, signToken({ userId: user.id, role: user.role }));
    return res;
  });
}
