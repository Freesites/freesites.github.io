import AdmZip from 'adm-zip';
import { withRetry } from '../utils/retry';

// ---------------------------------------------------------------------------
// Netlify Deploy API service.
//
// Each FreeSites client gets their own Netlify site (a single index.html).
// The site name is derived from the FreeSites siteId so it is stable across
// retries and will not create duplicate Netlify sites.
//
// Deploy flow:
//   1. ensureNetlifySite — create or verify the Netlify site
//   2. deployHtml       — zip the HTML, POST to the deploy endpoint
//   3. pollDeployReady  — poll until state === 'ready' or timeout
// ---------------------------------------------------------------------------

const NETLIFY_API = 'https://api.netlify.com/api/v1';
const POLL_INTERVAL_MS = 2_000;
const DEPLOY_TIMEOUT_MS = 90_000; // 90 seconds — generous for a single HTML file

function getToken(): string {
  const token = process.env.NETLIFY_API_TOKEN;
  if (!token) throw new Error('NETLIFY_API_TOKEN environment variable is not set');
  return token;
}

function netlifyHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// ensureNetlifySite — idempotent: if netlifySiteId is already stored on the
// content record, we verify it still exists on Netlify's side. If it does,
// we return it as-is. Only creates a new site on first deploy.
// ---------------------------------------------------------------------------

export async function ensureNetlifySite(
  existingNetlifySiteId: string | null,
  freesitesSiteId: string,
  businessName: string,
): Promise<string> {
  // If we already have a Netlify site ID, verify it is still reachable.
  if (existingNetlifySiteId) {
    const checkRes = await withRetry(() =>
      fetch(`${NETLIFY_API}/sites/${existingNetlifySiteId}`, {
        headers: netlifyHeaders(),
      }),
    );
    if (checkRes.ok) return existingNetlifySiteId;
    // Site not found — fall through and create a new one.
  }

  // Site name: 'fs-' prefix + first 20 chars of siteId (safe length, unique enough).
  // Netlify site names must be lowercase alphanumeric + hyphens, max 63 chars.
  const siteName = `fs-${freesitesSiteId.replace(/-/g, '').slice(0, 20)}`;

  const res = await withRetry(() =>
    fetch(`${NETLIFY_API}/sites`, {
      method: 'POST',
      headers: netlifyHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name: siteName }),
    }),
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Netlify createSite failed (${res.status}): ${body}`);
  }

  const site = await res.json() as { id: string };
  return site.id;
}

// ---------------------------------------------------------------------------
// deployHtml — zips the HTML into a single index.html, uploads it to
// Netlify, and waits for the deploy to reach state 'ready'.
// ---------------------------------------------------------------------------

export interface DeployResult {
  deployId: string;
  deployedUrl: string;
}

export async function deployHtml(
  netlifySiteId: string,
  html: string,
  logoBuffer?: Buffer | null,
  logoMimeType?: string | null,
): Promise<DeployResult> {
  const zipBuffer = buildSingleFileZip(html, logoBuffer, logoMimeType);

  const res = await withRetry(() =>
    fetch(`${NETLIFY_API}/sites/${netlifySiteId}/deploys`, {
      method: 'POST',
      headers: netlifyHeaders({ 'Content-Type': 'application/zip' }),
      body: zipBuffer,
    }),
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Netlify deploy upload failed (${res.status}): ${body}`);
  }

  const deploy = await res.json() as { id: string; state: string };
  const readyDeploy = await pollDeployReady(deploy.id);

  const deployedUrl = readyDeploy.ssl_url ?? readyDeploy.url;
  if (!deployedUrl) {
    throw new Error(`Deploy ${deploy.id} completed but returned no URL`);
  }

  return { deployId: deploy.id, deployedUrl };
}

// ---------------------------------------------------------------------------
// pollDeployReady — polls GET /deploys/{id} with exponential backoff until
// state is 'ready' or 'error', or the timeout is exceeded.
// ---------------------------------------------------------------------------

interface NetlifyDeploy {
  id: string;
  state: string;
  ssl_url?: string;
  url?: string;
  error_message?: string;
}

async function pollDeployReady(deployId: string): Promise<NetlifyDeploy> {
  const deadline = Date.now() + DEPLOY_TIMEOUT_MS;
  let delay = POLL_INTERVAL_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`${NETLIFY_API}/deploys/${deployId}`, {
      headers: netlifyHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Netlify deploy status check failed (${res.status})`);
    }

    const deploy = await res.json() as NetlifyDeploy;

    if (deploy.state === 'ready') return deploy;
    if (deploy.state === 'error') {
      throw new Error(`Netlify deploy failed: ${deploy.error_message ?? 'unknown error'}`);
    }

    await sleep(delay);
    // Gentle backoff: 2s → 3s → 4.5s → ... capped at 10s
    delay = Math.min(delay * 1.5, 10_000);
  }

  throw new Error(`Netlify deploy ${deployId} did not reach 'ready' within ${DEPLOY_TIMEOUT_MS}ms`);
}

// ---------------------------------------------------------------------------
// buildSingleFileZip — wraps index.html in a minimal ZIP buffer.
// ---------------------------------------------------------------------------

function buildSingleFileZip(
  html: string,
  logoBuffer?: Buffer | null,
  logoMimeType?: string | null,
): Buffer {
  const zip = new AdmZip();
  zip.addFile('index.html', Buffer.from(html, 'utf-8'));
  // Netlify ZIP deploys default to text/plain — the _headers file forces
  // the correct MIME type so browsers render the page instead of showing source.
  zip.addFile('_headers', Buffer.from('/index.html\n  Content-Type: text/html; charset=UTF-8\n', 'utf-8'));

  if (logoBuffer) {
    const ext = mimeToExt(logoMimeType ?? 'image/png');
    zip.addFile(`logo.${ext}`, logoBuffer);
  }

  return zip.toBuffer();
}

function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };
  return map[mimeType] ?? 'png';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
