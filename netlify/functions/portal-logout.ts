import type { Config } from '@netlify/functions';
import { getSessionToken, deleteSession, clearSessionCookie } from '../../src/services/auth';

// ---------------------------------------------------------------------------
// POST /api/portal/logout
//
// Invalidates the current session and clears the cookie. Safe to call even
// with an invalid or missing session — always returns 200.
// ---------------------------------------------------------------------------

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const token = getSessionToken(req);
  if (token) {
    try {
      await deleteSession(token);
    } catch {
      // Best-effort deletion — proceed to clear the cookie regardless.
    }
  }

  return new Response(JSON.stringify({ message: 'Signed out.' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(),
    },
  });
}

export const config: Config = {
  path: '/api/portal/logout',
};
