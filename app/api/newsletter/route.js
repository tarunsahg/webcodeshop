import { db } from '@/lib/db';
import { ok, fail, handle, parseJSON } from '@/lib/api-utils';
import { sendSubscribeWelcome } from '@/lib/mailer';

// Public newsletter signup. Records the email and sends a welcome email
// (via SMTP / Resend if configured, otherwise the dev outbox in ./data/mail).
export async function POST(req) {
  return handle(async () => {
    const body = await parseJSON(req);
    const email = String(body.email || '').toLowerCase().trim();
    const valid = email.length > 3 && email.includes('@') && email.includes('.') && !email.includes(' ');
    if (!valid) return fail(400, 'Please enter a valid email address.');

    let isNew = true;
    try {
      const r = db().prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(email);
      isNew = r.changes > 0;
    } catch (e) {
      console.error('[newsletter] db error:', e.message);
    }

    if (isNew) {
      try { await sendSubscribeWelcome(email); }
      catch (e) { console.error('[newsletter] welcome email failed:', e.message); }
    }

    return ok({ subscribed: true, isNew });
  });
}
