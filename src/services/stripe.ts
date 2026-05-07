import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Client — initialized lazily so the module can be imported in contexts
// where STRIPE_SECRET_KEY is not set (e.g. unit tests that mock this module).
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    _stripe = new Stripe(key, { apiVersion: '2023-10-16' });
  }
  return _stripe;
}

// ---------------------------------------------------------------------------
// createCheckoutSession — creates a Stripe Checkout session for a one-time
// payment and returns the hosted URL plus the session ID.
//
// siteId is embedded in session metadata so the webhook handler can load
// the correct content record without a separate index lookup.
// ---------------------------------------------------------------------------

export interface CheckoutSessionParams {
  siteId: string;
  businessName: string;
  email: string;
  planTier: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

export async function createCheckoutSession(
  params: CheckoutSessionParams,
): Promise<CheckoutSessionResult> {
  const foundingPriceId = process.env.STRIPE_FOUNDING_PRICE_ID;
  const standardPriceId = process.env.STRIPE_STANDARD_PRICE_ID;
  const successUrl = process.env.STRIPE_SUCCESS_URL;
  const cancelUrl = process.env.STRIPE_CANCEL_URL;

  if (!foundingPriceId) throw new Error('STRIPE_FOUNDING_PRICE_ID environment variable is not set');
  if (!standardPriceId) throw new Error('STRIPE_STANDARD_PRICE_ID environment variable is not set');
  if (!successUrl) throw new Error('STRIPE_SUCCESS_URL environment variable is not set');
  if (!cancelUrl) throw new Error('STRIPE_CANCEL_URL environment variable is not set');

  const priceId = params.planTier === 'founding' ? foundingPriceId : standardPriceId;

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'payment',
    customer_email: params.email,
    // siteId in metadata is the only link back to the content record.
    // businessName and planTier are included for Stripe dashboard legibility.
    metadata: {
      siteId: params.siteId,
      businessName: params.businessName,
      planTier: params.planTier,
    },
    success_url: `${successUrl}?siteId=${encodeURIComponent(params.siteId)}`,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error(
      `Stripe returned a checkout session without a URL (id=${session.id})`,
    );
  }

  return { sessionId: session.id, checkoutUrl: session.url };
}

// ---------------------------------------------------------------------------
// verifyWebhookSignature — validates the Stripe-Signature header and
// deserializes the event. Throws if the signature is invalid.
//
// rawBody must be the untouched request body string — any JSON parsing
// before this call will cause signature verification to fail.
// ---------------------------------------------------------------------------

export function verifyWebhookSignature(rawBody: string, sig: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');

  return getStripe().webhooks.constructEvent(rawBody, sig, secret);
}
