import type { Config } from '@netlify/functions';
import { z } from 'zod';
import { getSessionToken, verifySession } from '../../src/services/auth';
import { getContent, applyChangeRequest } from '../../src/services/blobs';

// ---------------------------------------------------------------------------
// POST /api/portal/change-request
//
// Accepts a plain-text change note from the authenticated client. Stores it
// as pendingChangeNote, increments siteVersion, and triggers the generation
// pipeline. Returns 409 if a generation is already running.
// ---------------------------------------------------------------------------

const GENERATING_STATUSES = new Set(['generating', 'generated', 'deploying']);

const BodySchema = z.object({
  note: z.string().trim().min(1).max(2000),
});

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const sessionToken = getSessionToken(req);
  if (!sessionToken) return unauthorized();

  const siteId = await verifySession(sessionToken);
  if (!siteId) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Request body must be valid JSON', 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('note must be between 1 and 2000 characters', 422);
  }

  const content = await getContent(siteId);
  if (!content) {
    return jsonError('Site record not found', 404);
  }

  if (content.activationStatus !== 'active') {
    return jsonError('Site is not active', 403);
  }

  if (GENERATING_STATUSES.has(content.deploymentStatus)) {
    return jsonError('A generation is already in progress. Check back shortly.', 409);
  }

  const ok = await applyChangeRequest(siteId, parsed.data.note);
  if (!ok) {
    return jsonError('Failed to save change request', 500);
  }

  await triggerGeneration(siteId);

  return new Response(JSON.stringify({ message: 'Change request submitted.' }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function triggerGeneration(siteId: string): Promise<void> {
  const baseUrl = process.env.URL ?? process.env.NETLIFY_URL;
  if (!baseUrl) {
    console.error(JSON.stringify({ event: 'portal.change_request.trigger_skipped', siteId }));
    return;
  }
  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId }),
    });
    console.log(JSON.stringify({ event: 'portal.change_request.triggered', siteId, status: res.status }));
  } catch (err) {
    console.error(JSON.stringify({ event: 'portal.change_request.trigger_failed', siteId, error: String(err) }));
  }
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

function unauthorized(): Response {
  return jsonError('Unauthorized', 401);
}

export const config: Config = {
  path: '/api/portal/change-request',
};
