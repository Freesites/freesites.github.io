import { Resend } from 'resend';
import type { ContentJson } from '../schemas/content.schema';
import { withRetry } from '../utils/retry';

// ---------------------------------------------------------------------------
// Lazy client — constructed on first use so the module can be imported in
// contexts where RESEND_API_KEY is not set (e.g. tests that mock this module).
// ---------------------------------------------------------------------------

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY environment variable is not set');
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'FreeSites <noreply@freesites.io>';

// ---------------------------------------------------------------------------
// sendMagicLinkEmail — portal authentication email.
// ---------------------------------------------------------------------------

export async function sendMagicLinkEmail(
  email: string,
  magicLink: string,
): Promise<void> {
  await withRetry(() =>
    getResend().emails.send({
      from: FROM,
      to: [email],
      subject: 'Your FreeSites sign-in link',
      html: magicLinkHtml(magicLink),
    }),
  );
}

// ---------------------------------------------------------------------------
// sendSiteReadyEmail — sent to the contractor when their site goes live.
// Idempotency: the caller checks deployment.successEmailSentAt before calling.
// ---------------------------------------------------------------------------

export async function sendSiteReadyEmail(
  content: ContentJson,
  deployedUrl: string,
): Promise<void> {
  const { name, email } = content.business;

  await withRetry(() =>
    getResend().emails.send({
      from: FROM,
      to: [email],
      subject: `Your FreeSites website is live, ${name}!`,
      html: siteReadyHtml(name, deployedUrl),
    }),
  );
}

// ---------------------------------------------------------------------------
// sendSiteFailureEmail — sent to the contractor when generation or
// deployment fails. Also sends an operator alert if OPERATOR_ALERT_EMAIL
// is configured so the team can investigate.
// Idempotency: the caller checks deployment.failureEmailSentAt before calling.
// ---------------------------------------------------------------------------

export async function sendSiteFailureEmail(
  content: ContentJson,
  reason: string,
): Promise<void> {
  const { name, email } = content.business;
  const resend = getResend();

  // Client email — no internal error details exposed.
  await withRetry(() =>
    resend.emails.send({
      from: FROM,
      to: [email],
      subject: `FreeSites: We hit a snag setting up your website`,
      html: siteFailureHtml(name),
    }),
  );

  // Operator alert — full context for investigation.
  const operatorEmail = process.env.OPERATOR_ALERT_EMAIL;
  if (operatorEmail) {
    await withRetry(() =>
      resend.emails.send({
        from: FROM,
        to: [operatorEmail],
        subject: `[FreeSites Alert] Generation/deploy failed — ${name}`,
        html: operatorAlertHtml(content, reason),
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// Email HTML templates
// ---------------------------------------------------------------------------

function siteReadyHtml(businessName: string, deployedUrl: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px">
      <h1 style="color:#1a2744">Your website is live!</h1>
      <p>Hi ${escHtml(businessName)},</p>
      <p>Your FreeSites website is ready and live at:</p>
      <p style="margin:24px 0">
        <a href="${escHtml(deployedUrl)}"
           style="background:#1a2744;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
          View Your Website
        </a>
      </p>
      <p>Share this link with your customers. If you'd like any changes,
         log in to your portal to submit a change request.</p>
      <p style="color:#666;font-size:14px;margin-top:40px">
        FreeSites · <a href="mailto:support@freesites.io">support@freesites.io</a>
      </p>
    </div>`;
}

function siteFailureHtml(businessName: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px">
      <h1 style="color:#1a2744">We hit a snag</h1>
      <p>Hi ${escHtml(businessName)},</p>
      <p>We ran into an issue generating your website. Our team has been
         notified and will follow up with you shortly.</p>
      <p>If you have questions in the meantime, reply to this email
         or contact us at
         <a href="mailto:support@freesites.io">support@freesites.io</a>.</p>
      <p style="color:#666;font-size:14px;margin-top:40px">
        FreeSites · <a href="mailto:support@freesites.io">support@freesites.io</a>
      </p>
    </div>`;
}

function operatorAlertHtml(content: ContentJson, reason: string): string {
  return `
    <div style="font-family:monospace;max-width:700px;margin:0 auto;padding:32px">
      <h2>FreeSites Generation/Deploy Failure</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:4px 8px;font-weight:bold">siteId</td>
            <td style="padding:4px 8px">${escHtml(content.siteId)}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold">business</td>
            <td style="padding:4px 8px">${escHtml(content.business.name)}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold">email</td>
            <td style="padding:4px 8px">${escHtml(content.business.email)}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold">vertical</td>
            <td style="padding:4px 8px">${escHtml(content.verticalType)}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold">siteVersion</td>
            <td style="padding:4px 8px">${content.siteVersion}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold">time</td>
            <td style="padding:4px 8px">${new Date().toISOString()}</td></tr>
      </table>
      <h3>Failure reason</h3>
      <pre style="background:#f5f5f5;padding:16px;overflow:auto">${escHtml(reason)}</pre>
    </div>`;
}

function magicLinkHtml(magicLink: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px">
      <h1 style="color:#1a2744">Sign in to FreeSites</h1>
      <p>Click the button below to sign in to your portal. This link expires in 15 minutes
         and can only be used once.</p>
      <p style="margin:24px 0">
        <a href="${escHtml(magicLink)}"
           style="background:#1a2744;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
          Sign In to Your Portal
        </a>
      </p>
      <p style="color:#666;font-size:14px">If you did not request this email, you can safely ignore it.</p>
      <p style="color:#666;font-size:14px;margin-top:40px">
        FreeSites · <a href="mailto:support@freesites.io">support@freesites.io</a>
      </p>
    </div>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
