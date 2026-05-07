import type { Config } from '@netlify/functions';
import { z } from 'zod';
import { getSiteIdByEmail } from '../../src/services/blobs';
import { createMagicToken } from '../../src/services/auth';
import { sendMagicLinkEmail } from '../../src/services/email';

// ---------------------------------------------------------------------------
// POST /api/portal/request-link
//
// Accepts an email address and sends a magic-link sign-in email if the
// address is registered. Always returns 200 regardless of whether the email
// is found — this prevents email enumeration.
// ---------------------------------------------------------------------------

const BodySchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Request body must be valid JSON', 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Valid email address required', 422);
  }

  const { email } = parsed.data;

  try {
    const siteId = await getSiteIdByEmail(email);

    if (siteId) {
      const token = await createMagicToken(siteId, email);
      const baseUrl = process.env.URL ?? process.env.NETLIFY_URL ?? '';
      const magicLink = `${baseUrl}/api/portal/verify?token=${token}`;
      await sendMagicLinkEmail(email, magicLink);
    }
    // If no siteId found: silent no-op — same 200 response to avoid enumeration.
  } catch (err) {
    console.error(JSON.stringify({ event: 'portal.request_link.error', error: String(err) }));
    // Still return 200 to avoid leaking whether the error was internal or
    // an "account not found" — the user experience is identical either way.
  }

  return json({ message: 'If that email is registered, a sign-in link is on its way.' });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number): Response {
  return json({ error: message }, status);
}

export const config: Config = {
  path: '/api/portal/request-link',
};
