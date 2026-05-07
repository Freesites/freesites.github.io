import type { Config } from '@netlify/functions';
import { getContent } from '../../src/services/blobs';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const siteId = url.pathname.split('/').pop();

  if (!siteId || siteId === 'status') {
    return json({ error: 'Missing siteId' }, 400);
  }

  const content = await getContent(siteId);
  if (!content) {
    return json({ error: 'Not found' }, 404);
  }

  return json({
    status: content.deploymentStatus,
    deployedUrl: content.deployment.deployedUrl,
    failureReason: content.deployment.failureReason,
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config: Config = {
  path: '/api/status/:siteId',
};
