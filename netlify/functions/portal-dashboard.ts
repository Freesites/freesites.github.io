import type { Config } from '@netlify/functions';
import { getSessionToken, verifySession } from '../../src/services/auth';
import { getContent } from '../../src/services/blobs';
import { buildDashboardData } from '../../src/services/portal';

// ---------------------------------------------------------------------------
// GET /api/portal/dashboard
//
// Returns dashboard data for the authenticated client. Requires a valid
// fs_session cookie. Returns 401 if the session is missing or expired.
// ---------------------------------------------------------------------------

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const sessionToken = getSessionToken(req);
  if (!sessionToken) return unauthorized();

  const siteId = await verifySession(sessionToken);
  if (!siteId) return unauthorized();

  const content = await getContent(siteId);
  if (!content) {
    console.error(JSON.stringify({ event: 'portal.dashboard.missing_content', siteId }));
    return new Response(JSON.stringify({ error: 'Site record not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return json(buildDashboardData(content));
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config: Config = {
  path: '/api/portal/dashboard',
};
