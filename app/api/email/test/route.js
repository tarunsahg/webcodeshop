import { requireAdmin } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';
import { sendTestEmail } from '@/lib/mailer';

export async function POST(req) {
  return handle(async () => {
    requireAdmin();
    const { to, subject, body } = await parseJSON(req);
    if (!to || !to.trim()) throw new Error('A recipient email address is required.');
    const provider = await sendTestEmail({
      to: to.trim(),
      subject: subject || 'Test email from WebCodeShop',
      text: body || 'This is a test email from WebCodeShop.',
    });
    return ok({ sent: true, provider });
  });
}
