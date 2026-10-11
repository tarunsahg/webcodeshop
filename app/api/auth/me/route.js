import { getSessionUser } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';

export async function GET() {
  return handle(async () => {
    const u = getSessionUser();
    return ok({ user: u || null });
  });
}
