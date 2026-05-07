import type { Config } from '@netlify/functions';
import { verifyMagicToken, createSession, buildSessionCookie } from '../../src/services/auth';

// ---------------------------------------------------------------------------
// GET /api/portal/verify?token=<magic-link-token>
//
// Exchanges a one-time magic-link token for a session cookie and redirects
// the user to the dashboard. Invalid or expired tokens redirect to the login
// page with an error query param.
// ---------------------------------------------------------------------------

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';

  if (!token) {
    return redirect('/portal/login.html?error=invalid');
  }

  let siteId: string;
  try {
    const result = await verifyMagicToken(token);
    if (!result) {
      return redirect('/portal/login.html?error=expired');
    }
    siteId = result.siteId;
  } catch (err) {
    console.error(JSON.stringify({ event: 'portal.verify.error', error: String(err) }));
    return redirect('/portal/login.html?error=invalid');
  }

  const sessionToken = await createSession(siteId);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/portal/dashboard.html',
      'Set-Cookie': buildSessionCookie(sessionToken),
    },
  });
}

function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { 'Location': location } });
}

export const config: Config = {
  path: '/api/portal/verify',
};
