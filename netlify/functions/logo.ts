import type { Config } from '@netlify/functions';
import { getLogo } from '../../src/services/blobs';

// ---------------------------------------------------------------------------
// GET /api/logo/:siteId
//
// Serves the uploaded logo binary for a site. Returns the raw image bytes
// with the correct Content-Type header so browsers render it inline.
// Returns 404 if no logo exists for the given siteId.
// ---------------------------------------------------------------------------

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const siteId = url.pathname.split('/').pop();

  if (!siteId) {
    return new Response('Not found', { status: 404 });
  }

  const logo = await getLogo(siteId);
  if (!logo) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(logo.data, {
    status: 200,
    headers: {
      'Content-Type': logo.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export const config: Config = {
  path: '/api/logo/:siteId',
};
