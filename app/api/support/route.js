import { db } from '@/lib/db';
import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

// Public: a visitor submits a message from the Help Center contact form.
export async function POST(req) {
  return handle(async () => {
    const { name, email, message } = await parseJSON(req);
    if (!message || !message.trim()) throw httpError(400, 'Message is required');
    db()
      .prepare('INSERT INTO support_messages (name,email,message) VALUES (?,?,?)')
      .run((name || '').trim() || null, (email || '').trim() || null, message.trim());
    return ok({ success: true });
  });
}

// Admin: list all Help Center messages, newest first.
export async function GET() {
  return handle(async () => {
    requireAdmin();
    const rows = db().prepare('SELECT * FROM support_messages ORDER BY datetime(created_at) DESC, id DESC').all();
    return ok({
      messages: rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        message: r.message,
        read: !!r.is_read,
        date: r.created_at,
      })),
    });
  });
}
