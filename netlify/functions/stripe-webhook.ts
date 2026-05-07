import type { Config } from '@netlify/functions';
import type Stripe from 'stripe';
import { verifyWebhookSignature } from '../../src/services/stripe';
import { activateContent } from '../../src/services/blobs';

// ---------------------------------------------------------------------------
// POST /api/stripe-webhook
//
// Receives Stripe webhook events. Only checkout.session.completed is
// actionable in Phase 1. All other event types are acknowledged and ignored.
//
// Idempotency:
//   Stripe retries unacknowledged webhooks up to 3 days. This handler
//   always returns 200 for valid signatures, even when the record is
//   already active or the siteId is missing — so Stripe never retries
//   for non-transient conditions.
//   Only signature failures (400) cause Stripe to retry.
//
// Security:
//   Signature verification with STRIPE_WEBHOOK_SECRET is the sole
//   authentication mechanism. The raw request body is read before any
//   parsing to preserve the bytes Stripe signed.
// ---------------------------------------------------------------------------

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return new Response('Missing Stripe-Signature header', { status: 400 });
  }

  // Read the raw body BEFORE any JSON parsing — Stripe signs the exact bytes.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(rawBody, sig);
  } catch (err) {
    console.error(JSON.stringify({ event: 'webhook.signature_failed', error: String(err) }));
    return new Response(`Signature verification failed: ${String(err)}`, { status: 400 });
  }

  console.log(JSON.stringify({ event: 'webhook.received', type: event.type, id: event.id }));

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
  }

  // Return 200 for all other event types — we do not need to handle them yet.
  return new Response('OK', { status: 200 });
}

// ---------------------------------------------------------------------------
// handleCheckoutCompleted — activates the client record tied to the session.
//
// siteId comes from session.metadata, which was set when the checkout
// session was created in the intake handler. This is the only link between
// Stripe and the content record — no secondary index is needed.
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const siteId = session.metadata?.siteId;

  if (!siteId) {
    // Should never happen if intake correctly sets metadata, but log and
    // return — do not throw, as that would produce a non-200 and cause retries.
    console.error(JSON.stringify({
      event: 'webhook.missing_site_id',
      sessionId: session.id,
    }));
    return;
  }

  const outcome = await activateContent(siteId, session.id);

  console.log(JSON.stringify({
    event: 'webhook.activation',
    outcome,
    siteId,
    sessionId: session.id,
  }));

  // 'session_mismatch' means siteId exists but has a different checkout session
  // stored. Log clearly for operator investigation; do not throw.
  if (outcome === 'session_mismatch') {
    console.error(JSON.stringify({
      event: 'webhook.session_mismatch',
      siteId,
      sessionId: session.id,
      message: 'The sessionId in the webhook does not match the stored checkout session for this siteId.',
    }));
    return;
  }

  // Trigger generation only on fresh activation. 'already_active' means
  // this is a duplicate webhook delivery — generation is already running
  // or complete, so we must not trigger again.
  if (outcome === 'activated') {
    await triggerGeneration(siteId);
  }
}

// ---------------------------------------------------------------------------
// triggerGeneration — fires a POST to the background orchestrator and awaits
// the 202. Because the generate endpoint is a Netlify Background Function,
// the 202 arrives almost immediately while generation continues for up to
// 15 minutes. This call is fire-and-log: a trigger failure is logged but
// does not make the webhook return a non-200 (which would cause Stripe to
// retry the whole activation flow).
// ---------------------------------------------------------------------------

async function triggerGeneration(siteId: string): Promise<void> {
  const baseUrl = process.env.URL ?? process.env.NETLIFY_URL;

  if (!baseUrl) {
    console.error(JSON.stringify({
      event: 'webhook.trigger_skipped',
      siteId,
      reason: 'URL env var not set — set URL or NETLIFY_URL to enable auto-trigger',
    }));
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId }),
    });

    console.log(JSON.stringify({
      event: 'webhook.generation_triggered',
      siteId,
      status: res.status,
    }));
  } catch (err) {
    console.error(JSON.stringify({
      event: 'webhook.trigger_failed',
      siteId,
      error: String(err),
    }));
  }
}

export const config: Config = {
  path: '/api/stripe-webhook',
};
