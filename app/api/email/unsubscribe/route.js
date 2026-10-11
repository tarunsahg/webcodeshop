import { ok, fail, handle, parseJSON } from '@/lib/api-utils';
import { verifyUnsub, setUnsubscribed, isUnsubscribed } from '@/lib/mailer';

// Public, token-protected. No login required so it works straight from an email.
export async function GET(req) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('e') || '';
    const token = searchParams.get('t') || '';
    if (!verifyUnsub(email, token)) return fail(400, 'This link is invalid or has expired.');
    return ok({ email, unsubscribed: isUnsubscribed(email) });
  });
}

export async function POST(req) {
  return handle(async () => {
    const { email, token, action } = await parseJSON(req);
    if (!verifyUnsub(email, token)) return fail(400, 'This link is invalid or has expired.');
    const unsubscribe = action !== 'resubscribe';
    setUnsubscribed(email, unsubscribe);
    return ok({ email, unsubscribed: unsubscribe });
  });
}
