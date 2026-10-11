import { clearSessionCookie } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';

export async function POST() {
  return handle(async () => {
    const res = ok({ success: true });
    clearSessionCookie(res);
    return res;
  });
}
