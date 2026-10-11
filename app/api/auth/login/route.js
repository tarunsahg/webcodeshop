import { db, verifyPassword } from '@/lib/db';
import { signToken, setSessionCookie, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

export async function POST(req) {
  return handle(async () => {
    const { email, password } = await parseJSON(req);
    if (!email || !password) throw httpError(400, 'Email and password required');
    const u = db().prepare('SELECT * FROM users WHERE email=? AND role=?').get(email.toLowerCase().trim(), 'customer');
    if (!u || !verifyPassword(password, u.password)) throw httpError(401, 'Invalid email or password');
    const res = ok({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
    setSessionCookie(res, signToken({ userId: u.id, role: u.role }));
    return res;
  });
}
