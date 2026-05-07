# FreeSites Generator

AI-powered single-page website generator for local service businesses. A contractor fills in one form; Claude generates a complete HTML website and deploys it live to Netlify — in under 2 minutes.

Supported verticals: Plumbing, Electrical, HVAC, Roofing, Church / Faith Communities.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Hosting & Functions | Netlify Functions v2 |
| Storage | Netlify Blobs |
| AI Generation | Anthropic Claude (claude-haiku-4-5 default) |
| Payments | Stripe Checkout |
| Email | Resend |
| Deploy target | Netlify Sites API |

---

## Local Development

### Prerequisites

- Node.js 18+
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`npm i -g netlify-cli`)
- A Netlify account (free tier works for dev)
- Anthropic API key

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env
# Edit .env — at minimum set ANTHROPIC_API_KEY and BETA_CODE

# 3. Link to a Netlify site (required for Blobs sandbox)
netlify link   # or: netlify sites:create

# 4. Start dev server
netlify dev
```

Open http://localhost:8888 — the intake form is at `/` and all API routes are live.

### What to expect

Submitting the form with `betaCode` matching your `BETA_CODE` env var:
1. Creates a content record in Netlify Blobs
2. Triggers the background function which calls Claude
3. Deploys a ZIP to a new Netlify site
4. Sends a confirmation email via Resend

Check logs in the `netlify dev` terminal for structured JSON events.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `CLAUDE_MODEL` | No | Model ID (default: `claude-sonnet-4-6`) |
| `CLAUDE_MAX_TOKENS` | No | Max output tokens (default: `8000`) |
| `PROMPTS_DIR` | No | Override prompt template directory |
| `STRIPE_SECRET_KEY` | Yes (paid) | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes (paid) | Stripe webhook signing secret |
| `STRIPE_FOUNDING_PRICE_ID` | Yes (paid) | Stripe Price ID for founding-member plan |
| `STRIPE_STANDARD_PRICE_ID` | Yes (paid) | Stripe Price ID for standard plan |
| `STRIPE_SUCCESS_URL` | Yes (paid) | Redirect URL after successful payment |
| `STRIPE_CANCEL_URL` | Yes (paid) | Redirect URL after cancelled payment |
| `BETA_CODE` | No | Secret code to bypass Stripe (beta clients) |
| `RESEND_API_KEY` | Yes (email) | Resend API key |
| `RESEND_FROM_EMAIL` | No | Sender address (default: `noreply@freesites.ai`) |
| `OPERATOR_ALERT_EMAIL` | No | Email to notify on generation failures |
| `PORTAL_JWT_SECRET` | Yes (portal) | Secret for signing portal magic-link tokens |

---

## Architecture

```
Browser (index.html)
  │
  ▼ POST /api/intake
netlify/functions/intake.ts
  │  • Validates form data
  │  • Stores logo to Netlify Blobs (freesites-logos)
  │  • Creates content record (freesites-content)
  │  • Beta path → record active, no Stripe
  │  • Paid path → creates Stripe Checkout session
  │
  ▼ POST /api/generate  (202 immediately)
netlify/functions/generate-background.ts
  │  • Acquires per-site optimistic lock
  │  • Calls Claude with vertical-specific prompt template
  │  • Saves HTML to Netlify Blobs (freesites-html)
  │  • Creates/verifies Netlify site via API
  │  • ZIPs HTML + logo, deploys to Netlify
  │  • Runs HTTP health check
  │  • Sends success/failure email via Resend

Stripe webhook → POST /api/stripe-webhook
  │  • Validates signature
  │  • On checkout.session.completed → activates content record
  │  • Triggers /api/generate
```

---

## Adding a New Vertical

1. **Add to enum** — `src/schemas/intake.schema.ts` and `src/schemas/content.schema.ts`: add the new value to the `verticalType` enum.

2. **Add vertical schema** — In `src/schemas/content.schema.ts`, define a `VerticalXxxSchema` with the unique fields for that trade, then add `vertical_xxx` to `ContentSchema`.

3. **Add defaults** — In `src/defaults/content.defaults.ts`, add a default `vertical_xxx` block to `buildDefaultContent()`.

4. **Add mapper case** — In `src/mappers/prompt.mapper.ts`, add a `case 'xxx':` to the switch that includes `vertical_xxx` in the payload and excludes all other vertical sub-objects.

5. **Add prompt schema** — In `src/schemas/prompt-payload.schema.ts`, extend the discriminated union with the new variant.

6. **Create prompt template** — Add `src/prompts/xxx.txt`. Include `{{CONTENT_JSON}}` exactly once. Model after `electrical.txt`.

7. **Update the form** — Add `<option value="xxx">Display Name</option>` to the Trade dropdown in `public/index.html`.

---

## API Endpoints

| Method | Path | Function | Description |
|---|---|---|---|
| POST | `/api/intake` | `intake.ts` | Submit intake form, create content record |
| POST | `/api/generate` | `generate-background.ts` | Trigger AI generation + deploy pipeline |
| POST | `/api/stripe-webhook` | `stripe-webhook.ts` | Handle Stripe payment events |
| GET | `/api/status/:siteId` | `status.ts` | Poll deployment status |
| GET | `/api/logo/:siteId` | `logo.ts` | Serve uploaded logo binary |
| GET | `/api/portal/me` | `portal-me.ts` | Get portal content for logged-in user |
| POST | `/api/portal/change` | `portal-change.ts` | Submit a change request |
| POST | `/api/portal/login` | `portal-login.ts` | Send magic-link sign-in email |
| GET | `/api/portal/verify` | `portal-verify.ts` | Verify magic-link token, issue JWT |
| GET | `/api/health` | — | Function health check |

---

## Prompt Templates

Templates live in `src/prompts/{vertical}.txt`. They are plain text files with a single `{{CONTENT_JSON}}` placeholder where the client's data is injected.

The static portion of each template (before `{{CONTENT_JSON}}`) is sent to Claude with `cache_control: { type: 'ephemeral' }` so repeated calls for the same vertical hit the prompt cache — saving ~90% of input token cost after the first invocation.

To edit a template: update the `.txt` file and redeploy. No code changes needed.

---

## Deploying to Production

1. Push to GitHub and connect to Netlify via the dashboard.
2. In Netlify → Site settings → Environment variables, set all required variables from the table above.
3. Ensure your Resend domain is verified and `RESEND_FROM_EMAIL` uses that domain.
4. Set up a Stripe webhook pointing to `https://your-site.netlify.app/api/stripe-webhook` with event `checkout.session.completed`.
5. Deploy — Netlify will run `npm run build` (TypeScript compile) and bundle the functions automatically.
