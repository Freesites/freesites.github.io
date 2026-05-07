import type { Config } from '@netlify/functions';
import { PublicIntakeSchema } from '../../src/schemas/public-intake.schema';
import type { IntakeFormData } from '../../src/schemas/intake.schema';
import { buildDefaultContent } from '../../src/defaults/content.defaults';
import { putContent, setSiteIdForEmail, putLogo } from '../../src/services/blobs';
import { createCheckoutSession } from '../../src/services/stripe';

// ---------------------------------------------------------------------------
// POST /api/intake
//
// Accepts a public intake form submission. Admin-only flags (isBetaClient,
// isFounderMember, planTier) are never read from the request body — they are
// set by server-side logic only.
//
// Two paths:
//   Beta   — betaCode validates against BETA_CODE env var → record created
//            in 'active' state, Stripe skipped, siteId returned immediately.
//   Standard — record created in 'draft' state, Stripe checkout session
//              created, record updated to 'pending_payment', checkoutUrl
//              returned for client-side redirect.
// ---------------------------------------------------------------------------

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Request body must be valid JSON', 400);
  }

  // Parse and validate — admin-only fields are not in PublicIntakeSchema
  // so they are stripped from body before any of our code sees them.
  const parsed = PublicIntakeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.format());
  }

  const { betaCode, logoBase64, logoMimeType, ...intakeFields } = parsed.data;

  // betaCode is validated here and discarded — it is never stored or logged.
  const isBetaClient = validateBetaCode(betaCode);

  // Server enforces all plan and membership flags for Phase 1.
  const intakeData: IntakeFormData = {
    ...intakeFields,
    isBetaClient,
    isFounderMember: true,   // All Phase 1 intake are founding members.
    planTier: 'founding',
  };

  try {
    // buildDefaultContent sets activationStatus based on isBetaClient:
    //   beta   → 'active',          billing.planActivated = true
    //   standard → 'draft',         billing.planActivated = false
    let content = buildDefaultContent(intakeData);

    // If a logo was uploaded, store it and set logoUrl to the relative path used
    // in the deployed ZIP (e.g. "./logo.png"). Claude will embed this path in the
    // generated HTML; the same file is added to the ZIP by deploy.ts.
    if (logoBase64 && logoMimeType) {
      const base64Data = logoBase64.replace(/^data:[^;]+;base64,/, '');
      const logoBuffer = Buffer.from(base64Data, 'base64');
      await putLogo(content.siteId, logoBuffer, logoMimeType);
      const ext = mimeToExt(logoMimeType);
      content = {
        ...content,
        business: {
          ...content.business,
          logoUrl: `./logo.${ext}`,
        },
      };
    }

    // Beta path — record is already active, no Stripe needed.
    if (isBetaClient) {
      await putContent(content);
      await setSiteIdForEmail(content.business.email, content.siteId);
      return json({ siteId: content.siteId, status: 'active', betaClient: true }, 201);
    }

    // Standard path — create Stripe checkout before the first putContent
    // so we never have a 'draft' record without a checkout URL on retry.
    const { sessionId, checkoutUrl } = await createCheckoutSession({
      siteId: content.siteId,
      businessName: content.business.name,
      email: content.business.email,
      planTier: content.planTier,
    });

    const withCheckout = {
      ...content,
      activationStatus: 'pending_payment' as const,
      billing: {
        ...content.billing,
        stripeCheckoutSessionId: sessionId,
        stripeCheckoutUrl: checkoutUrl,
      },
    };

    await putContent(withCheckout);
    await setSiteIdForEmail(content.business.email, content.siteId);

    return json({ siteId: content.siteId, checkoutUrl, status: 'pending_payment' }, 201);
  } catch (err) {
    console.error(JSON.stringify({ event: 'intake.error', error: String(err) }));
    return jsonError('An unexpected error occurred', 500);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// validateBetaCode — constant-time string comparison to prevent timing
// attacks. Falls through to false if BETA_CODE is not configured so the
// endpoint degrades gracefully rather than exposing an open bypass.
function validateBetaCode(code: string | undefined): boolean {
  const expected = process.env.BETA_CODE;
  if (!expected || !code) return false;

  // Constant-time compare: XOR every byte so timing doesn't leak length match.
  if (code.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= code.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number, details?: unknown): Response {
  return json({ error: message, ...(details !== undefined ? { details } : {}) }, status);
}

export const config: Config = {
  path: '/api/intake',
};
