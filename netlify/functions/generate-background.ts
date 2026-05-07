import type { Config } from '@netlify/functions';
import {
  getContent,
  getHtml,
  putHtml,
  htmlExists,
  acquireOrchestrationLock,
  updateDeploymentStatus,
  clearPendingChangeNote,
  getLogo,
} from '../../src/services/blobs';
import { generateSite } from '../../src/services/claude';
import { ensureNetlifySite, deployHtml } from '../../src/services/deploy';
import { runHealthCheck } from '../../src/services/health';
import { sendSiteReadyEmail, sendSiteFailureEmail } from '../../src/services/email';
import type { ContentJson } from '../../src/schemas/content.schema';

// ---------------------------------------------------------------------------
// POST /api/generate  (Netlify Background Function — responds 202 immediately)
//
// Orchestrates the full generate → deploy → health-check → email pipeline
// for a single site. Safe to call multiple times — the lock + per-step
// idempotency guards ensure exactly-once semantics even under retries.
//
// Expected request body: { "siteId": "<uuid>" }
//
// Status progression written to the content record:
//   generating → generated → deploying → deployed   (success)
//   generating → failed                              (any step fails)
// ---------------------------------------------------------------------------

export default async function handler(req: Request): Promise<void> {
  let siteId: string | undefined;

  try {
    const body = await req.json() as { siteId?: string };
    siteId = body.siteId;
  } catch {
    log('orchestrate.bad_request', { error: 'invalid JSON body' });
    return;
  }

  if (!siteId) {
    log('orchestrate.bad_request', { error: 'missing siteId' });
    return;
  }

  // Hard deadline: background Lambdas have a 15-min limit. If the pipeline
  // hasn't finished in 12 minutes, write 'failed' so the frontend doesn't
  // spin forever and the Lambda has 3 min of buffer to flush the Blobs write.
  const DEADLINE_MS = 12 * 60 * 1000;
  let deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  const deadlinePromise = new Promise<never>((_, reject) => {
    deadlineTimer = setTimeout(
      () => reject(new Error(`Pipeline deadline: ${DEADLINE_MS / 60000} min limit reached`)),
      DEADLINE_MS,
    );
  });

  try {
    await Promise.race([orchestrate(siteId), deadlinePromise]);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    log('orchestrate.deadline_exceeded', { siteId, reason });
    try {
      await updateDeploymentStatus(siteId, 'failed', { failureReason: reason });
      const fresh = await getContent(siteId);
      if (fresh && fresh.deployment.failureEmailSentAt === null) {
        await sendSiteFailureEmail(fresh, reason);
        await updateDeploymentStatus(siteId, 'failed', {
          failureEmailSentAt: new Date().toISOString(),
        });
      }
    } catch (writeErr) {
      log('orchestrate.deadline_write_failed', { siteId, error: String(writeErr) });
    }
  } finally {
    if (deadlineTimer !== null) clearTimeout(deadlineTimer);
  }
}

// ---------------------------------------------------------------------------
// orchestrate — the full pipeline. Errors at any step are caught at the top
// level, written to deployment.failureReason, and emailed to the client.
// ---------------------------------------------------------------------------

async function orchestrate(siteId: string): Promise<void> {
  log('orchestrate.start', { siteId });

  // 1. Load and validate the record.
  const content = await getContent(siteId);
  if (!content) {
    log('orchestrate.not_found', { siteId });
    return;
  }

  if (content.activationStatus !== 'active') {
    log('orchestrate.not_active', { siteId, activationStatus: content.activationStatus });
    return;
  }

  // 2. Acquire the per-site lock.
  const runId = await acquireOrchestrationLock(siteId);
  if (!runId) {
    log('orchestrate.lock_failed', { siteId });
    return;
  }

  log('orchestrate.lock_acquired', { siteId, runId });

  // Re-read content after lock acquisition to pick up the latest siteVersion
  // and pendingChangeNote. The initial `content` read above may have been stale
  // if a portal change request was written just before the lock was acquired.
  const freshContent = await getContent(siteId);
  if (!freshContent) {
    log('orchestrate.record_vanished', { siteId });
    return;
  }

  try {
    await runPipeline(freshContent, siteId);
  } catch (err) {
    const reason = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
    log('orchestrate.failed', { siteId, reason });

    await updateDeploymentStatus(siteId, 'failed', { failureReason: reason });

    // Re-read fresh content for the failure email (business fields are needed).
    const fresh = await getContent(siteId);
    if (fresh && fresh.deployment.failureEmailSentAt === null) {
      try {
        await sendSiteFailureEmail(fresh, reason);
        await updateDeploymentStatus(siteId, 'failed', {
          failureEmailSentAt: new Date().toISOString(),
        });
      } catch (emailErr) {
        log('orchestrate.failure_email_error', { siteId, error: String(emailErr) });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// runPipeline — the happy path. Each step re-reads the latest content record
// before writing so concurrent portal updates are not silently overwritten.
// ---------------------------------------------------------------------------

async function runPipeline(
  initialContent: ContentJson,
  siteId: string,
): Promise<void> {
  const { siteVersion } = initialContent;

  // ------------------------------------------------------------------
  // Step 1: Generate HTML (idempotent — re-uses stored HTML if it exists
  // for this exact siteId + siteVersion).
  // ------------------------------------------------------------------

  let html: string;

  if (await htmlExists(siteId, siteVersion)) {
    log('orchestrate.html_cache_hit', { siteId, siteVersion });
    html = (await getHtml(siteId, siteVersion))!;
  } else {
    log('orchestrate.generating', { siteId, siteVersion });

    const result = await generateSite(initialContent);

    log('orchestrate.generated', {
      siteId,
      templateHash: result.templateHash,
      retried: result.retried,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });

    html = result.html;
    const now = new Date().toISOString();
    await putHtml(siteId, siteVersion, html);
    await updateDeploymentStatus(siteId, 'generated', { lastGeneratedAt: now });
    // Clear the change note so it is not re-applied on a subsequent generation.
    await clearPendingChangeNote(siteId);
  }

  // ------------------------------------------------------------------
  // Step 2: Ensure a Netlify site exists for this client.
  //         Uses the stored netlifySiteId if available (idempotent).
  // ------------------------------------------------------------------

  const contentAfterGen = await getContent(siteId);
  if (!contentAfterGen) throw new Error(`Record disappeared mid-pipeline: siteId=${siteId}`);

  const netlifySiteId = await ensureNetlifySite(
    contentAfterGen.deployment.netlifySiteId,
    siteId,
    contentAfterGen.business.name,
  );

  if (netlifySiteId !== contentAfterGen.deployment.netlifySiteId) {
    await updateDeploymentStatus(siteId, 'generated', { netlifySiteId });
  }

  // ------------------------------------------------------------------
  // Step 3: Deploy the HTML to Netlify.
  // ------------------------------------------------------------------

  await updateDeploymentStatus(siteId, 'deploying', { netlifySiteId });

  log('orchestrate.deploying', { siteId, netlifySiteId });

  // Fetch the logo from Blobs if the client uploaded one.
  let logoBuffer: Buffer | null = null;
  let logoMimeType: string | null = null;
  if (contentAfterGen.business.logoUrl) {
    const logo = await getLogo(siteId);
    if (logo) {
      logoBuffer = Buffer.from(logo.data);
      logoMimeType = logo.mimeType;
    }
  }

  const deployResult = await deployHtml(netlifySiteId, html, logoBuffer, logoMimeType);

  log('orchestrate.deploy_complete', {
    siteId,
    deployId: deployResult.deployId,
    deployedUrl: deployResult.deployedUrl,
  });

  // ------------------------------------------------------------------
  // Step 4: Health check — HTTP 200 and business name presence.
  // A failed health check is recorded but does NOT fail the pipeline;
  // the site is considered deployed and the operator is alerted via the
  // operator_alert mechanism in sendSiteReadyEmail if needed.
  // ------------------------------------------------------------------

  const contentForHealth = await getContent(siteId);
  const businessName = contentForHealth?.business.name ?? '';

  const health = await runHealthCheck(deployResult.deployedUrl, businessName);

  log('orchestrate.health_check', {
    siteId,
    passed: health.passed,
    statusCode: health.statusCode,
    containsBusinessName: health.containsBusinessName,
    error: health.error,
  });

  // ------------------------------------------------------------------
  // Step 5: Mark deployed and send success email.
  // ------------------------------------------------------------------

  const deployedAt = new Date().toISOString();

  await updateDeploymentStatus(siteId, 'deployed', {
    netlifyDeployId: deployResult.deployId,
    deployedUrl: deployResult.deployedUrl,
    deployedAt,
    healthCheckPassed: health.passed,
    // Clear any previous failure reason from a prior run.
    failureReason: null,
  });

  log('orchestrate.success', { siteId, deployedUrl: deployResult.deployedUrl });

  // Guard: only send success email if it hasn't already been sent.
  const finalContent = await getContent(siteId);
  if (finalContent && finalContent.deployment.successEmailSentAt === null) {
    try {
      await sendSiteReadyEmail(finalContent, deployResult.deployedUrl);
      await updateDeploymentStatus(siteId, 'deployed', {
        successEmailSentAt: new Date().toISOString(),
      });
    } catch (emailErr) {
      // Email failure is non-fatal — the site is live regardless.
      log('orchestrate.success_email_error', { siteId, error: String(emailErr) });
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ event, ...data }));
}

export const config: Config = {
  path: '/api/generate',
};
