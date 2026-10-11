import { requireAdmin } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';
import { verifySmtp } from '@/lib/mailer';

export async function POST() {
  return handle(async () => {
    requireAdmin();
    await verifySmtp();
    return ok({ verified: true });
  });
}
