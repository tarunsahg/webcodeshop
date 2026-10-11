import { db, hashPassword } from '@/lib/db';
import { signToken, setSessionCookie, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';
import { sendWelcome } from '@/lib/mailer';

export async function POST(req) {
  return handle(async () => {
    const { name, email, password } = await parseJSON(req);
    if (!name || !email || !password) throw httpError(400, 'All fields required');
    if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
    const e = email.toLowerCase().trim();
    const exists = db().prepare('SELECT id FROM users WHERE email=?').get(e);
    if (exists) throw httpError(409, 'Email already registered');
    const info = db().prepare('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)').run(name.trim(), e, hashPassword(password), 'customer');
    const user = { id: info.lastInsertRowid, name: name.trim(), email: e, role: 'customer' };
    sendWelcome(user).catch(() => {});
    const res = ok({ user });
    setSessionCookie(res, signToken({ userId: info.lastInsertRowid, role: 'customer' }));
    return res;
  });
}
