import { randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { ContentSchema } from '../schemas/content.schema';
import type { ContentJson, Deployment } from '../schemas/content.schema';

// ---------------------------------------------------------------------------
// Store names — two named stores keep content and HTML clearly separated.
// Netlify creates them on first write; no provisioning needed.
// ---------------------------------------------------------------------------

const CONTENT_STORE = 'freesites-content';
const HTML_STORE = 'freesites-html';
const EMAIL_INDEX_STORE = 'freesites-email-index';
const LOGO_STORE = 'freesites-logos';

// ---------------------------------------------------------------------------
// Content record helpers
// ---------------------------------------------------------------------------

export async function getContent(siteId: string): Promise<ContentJson | null> {
  const store = getStore(CONTENT_STORE);
  const raw = await store.get(siteId, { type: 'text' });
  if (raw === null) return null;

  const result = ContentSchema.safeParse(JSON.parse(raw));
  if (!result.success) {
    throw new Error(
      `Stored content for siteId=${siteId} failed schema validation: ` +
      result.error.message,
    );
  }
  return result.data;
}

export async function putContent(content: ContentJson): Promise<void> {
  const store = getStore(CONTENT_STORE);
  await store.set(content.siteId, JSON.stringify(content, null, 2));
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

// Key scheme: {siteId}/v{siteVersion}
// Storing by version means old HTML is never overwritten — every regeneration
// produces a new key. The deploy step reads the key matching siteVersion.
function htmlKey(siteId: string, siteVersion: number): string {
  return `${siteId}/v${siteVersion}`;
}

export async function getHtml(
  siteId: string,
  siteVersion: number,
): Promise<string | null> {
  const store = getStore(HTML_STORE);
  return store.get(htmlKey(siteId, siteVersion), { type: 'text' });
}

export async function putHtml(
  siteId: string,
  siteVersion: number,
  html: string,
): Promise<void> {
  const store = getStore(HTML_STORE);
  await store.set(htmlKey(siteId, siteVersion), html);
}

// htmlExists is used by the generation orchestrator to make the
// generate → blob-save step idempotent: if the HTML for this exact
// siteId + siteVersion already exists, skip generation entirely.
export async function htmlExists(
  siteId: string,
  siteVersion: number,
): Promise<boolean> {
  const store = getStore(HTML_STORE);
  const metadata = await store.getMetadata(htmlKey(siteId, siteVersion));
  return metadata !== null;
}

// ---------------------------------------------------------------------------
// Email → siteId index — written at intake, read by the portal login flow.
// ---------------------------------------------------------------------------

export async function setSiteIdForEmail(email: string, siteId: string): Promise<void> {
  const store = getStore(EMAIL_INDEX_STORE);
  await store.set(email.toLowerCase(), siteId);
}

export async function getSiteIdByEmail(email: string): Promise<string | null> {
  const store = getStore(EMAIL_INDEX_STORE);
  return store.get(email.toLowerCase(), { type: 'text' });
}

// ---------------------------------------------------------------------------
// Logo helpers — stores raw binary (Buffer) keyed by siteId.
// The MIME type is persisted as metadata so the serving function can set
// the correct Content-Type without re-parsing the binary.
// ---------------------------------------------------------------------------

export async function putLogo(
  siteId: string,
  data: Buffer,
  mimeType: string,
): Promise<void> {
  const store = getStore(LOGO_STORE);
  await store.set(siteId, data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer, { metadata: { mimeType } });
}

export async function getLogo(
  siteId: string,
): Promise<{ data: ArrayBuffer; mimeType: string } | null> {
  const store = getStore(LOGO_STORE);
  const { data, metadata } = await store.getWithMetadata(siteId, { type: 'arrayBuffer' });
  if (data === null) return null;
  const mimeType = (metadata as Record<string, string> | null)?.mimeType ?? 'image/png';
  return { data, mimeType };
}

// ---------------------------------------------------------------------------
// applyChangeRequest — increments siteVersion, sets pendingChangeNote, and
// appends an audit entry. Resets deploymentStatus to 'idle' so the
// orchestrator treats this as a fresh generation request.
// ---------------------------------------------------------------------------

export async function applyChangeRequest(siteId: string, note: string): Promise<boolean> {
  const content = await getContent(siteId);
  if (!content) return false;

  const now = new Date().toISOString();
  await putContent({
    ...content,
    siteVersion: content.siteVersion + 1,
    pendingChangeNote: note,
    deploymentStatus: 'idle',
    lastUpdated: now,
    changeHistory: [...content.changeHistory, { requestedAt: now, note }],
  });
  return true;
}

// ---------------------------------------------------------------------------
// clearPendingChangeNote — called by the orchestrator after a successful
// HTML generation so the note is not re-applied on the next generation.
// ---------------------------------------------------------------------------

export async function clearPendingChangeNote(siteId: string): Promise<void> {
  const content = await getContent(siteId);
  if (!content || content.pendingChangeNote === null) return;
  await putContent({
    ...content,
    pendingChangeNote: null,
    lastUpdated: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// acquireOrchestrationLock — optimistic per-site lock for the generation
// orchestrator. Returns the runId string on success, null if the lock is
// held by another invocation or the race was lost.
//
// Algorithm:
//   1. Read current record and check for an active (non-stale) lock.
//   2. Write record with a fresh runId + lockAcquiredAt.
//   3. Read back and verify our runId is still there (last-write-wins race
//      detection — if another process wrote simultaneously, we'll see a
//      different runId and gracefully exit).
// ---------------------------------------------------------------------------

const LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function acquireOrchestrationLock(
  siteId: string,
): Promise<string | null> {
  // Brief pause before reading so any concurrent write (e.g. applyChangeRequest)
  // has time to propagate. Without this, the lock write can overwrite a freshly
  // written pendingChangeNote with stale data.
  await new Promise(r => setTimeout(r, 800));

  const content = await getContent(siteId);
  if (!content) return null;

  const { deploymentStatus, deployment } = content;

  // Treat generating/deploying as locked unless the lock is stale.
  if (
    (deploymentStatus === 'generating' || deploymentStatus === 'deploying') &&
    deployment.lockAcquiredAt !== null &&
    Date.now() - new Date(deployment.lockAcquiredAt).getTime() < LOCK_TTL_MS
  ) {
    return null;
  }

  const runId = randomUUID();
  const now = new Date().toISOString();

  await putContent({
    ...content,
    deploymentStatus: 'generating',
    lastUpdated: now,
    deployment: {
      ...deployment,
      runId,
      lockAcquiredAt: now,
      failureReason: null, // clear any previous failure so logs are clean
    },
  });

  // Read back to detect a simultaneous write. Retry a few times to tolerate
  // transient Blobs read-after-write propagation lag in Lambda environments.
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 400 * attempt));
    const verify = await getContent(siteId);
    if (verify?.deployment.runId === runId) return runId;
  }

  return null;
}

// ---------------------------------------------------------------------------
// updateDeploymentStatus — writes a partial deployment update atomically
// with the new status. Always re-reads the record to avoid overwriting
// concurrent updates from other fields (e.g. portal change requests).
// ---------------------------------------------------------------------------

export async function updateDeploymentStatus(
  siteId: string,
  status: ContentJson['deploymentStatus'],
  updates: Partial<Deployment> = {},
): Promise<void> {
  const content = await getContent(siteId);
  if (!content) {
    throw new Error(`updateDeploymentStatus: record not found for siteId=${siteId}`);
  }

  await putContent({
    ...content,
    deploymentStatus: status,
    lastUpdated: new Date().toISOString(),
    deployment: { ...content.deployment, ...updates },
  });
}

// ---------------------------------------------------------------------------
// activateContent — transitions a record from pending_payment → active.
//
// Called by the Stripe webhook handler after checkout.session.completed.
// Idempotency: if the record is already active this is a safe no-op so
// duplicate Stripe deliveries never cause double-processing.
//
// The sessionId cross-check guards against a race where a second checkout
// session was created for the same siteId (shouldn't happen in Phase 1,
// but defensive).
//
// Returns a discriminated result so callers can log accurately.
// ---------------------------------------------------------------------------

export type ActivationOutcome = 'activated' | 'already_active' | 'not_found' | 'session_mismatch';

export async function activateContent(
  siteId: string,
  sessionId: string,
): Promise<ActivationOutcome> {
  const content = await getContent(siteId);

  if (!content) return 'not_found';
  if (content.activationStatus === 'active') return 'already_active';

  if (content.billing.stripeCheckoutSessionId !== sessionId) {
    return 'session_mismatch';
  }

  const now = new Date().toISOString();
  await putContent({
    ...content,
    activationStatus: 'active',
    lastUpdated: now,
    billing: {
      ...content.billing,
      activatedAt: now,
      planActivated: true,
    },
  });

  return 'activated';
}
