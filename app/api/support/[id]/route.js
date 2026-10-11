import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';

// Admin: delete a Help Center message.
export async function DELETE(_req, { params }) {
  return handle(async () => {
    requireAdmin();
    db().prepare('DELETE FROM support_messages WHERE id=?').run(params.id);
    return ok({ success: true });
  });
}
