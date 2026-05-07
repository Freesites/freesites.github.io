import { randomBytes } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const MAGIC_LINK_STORE = 'freesites-magic-links';
const SESSION_STORE = 'freesites-sessions';

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

interface MagicLinkRecord {
  siteId: string;
  email: string;
  expiresAt: number;
}

interface SessionRecord {
  siteId: string;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Magic links — one-time, 15-minute tokens for passwordless login.
// ---------------------------------------------------------------------------

export async function createMagicToken(siteId: string, email: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const store = getStore(MAGIC_LINK_STORE);
  const record: MagicLinkRecord = { siteId, email, expiresAt: Date.now() + MAGIC_LINK_TTL_MS };
  await store.set(token, JSON.stringify(record));
  return token;
}

export async function verifyMagicToken(
  token: string,
): Promise<{ siteId: string; email: string } | null> {
  const store = getStore(MAGIC_LINK_STORE);
  const raw = await store.get(token, { type: 'text' });
  if (raw === null) return null;

  const record: MagicLinkRecord = JSON.parse(raw);

  // Always delete — expired tokens are cleaned up; valid tokens are one-time use.
  await store.delete(token);

  if (Date.now() > record.expiresAt) return null;
  return { siteId: record.siteId, email: record.email };
}

// ---------------------------------------------------------------------------
// Sessions — 30-day tokens stored in Blobs. Expiry enforced at read time.
// ---------------------------------------------------------------------------

export async function createSession(siteId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const store = getStore(SESSION_STORE);
  const record: SessionRecord = { siteId, expiresAt: Date.now() + SESSION_TTL_MS };
  await store.set(token, JSON.stringify(record));
  return token;
}

export async function verifySession(token: string): Promise<string | null> {
  const store = getStore(SESSION_STORE);
  const raw = await store.get(token, { type: 'text' });
  if (raw === null) return null;

  const record: SessionRecord = JSON.parse(raw);
  if (Date.now() > record.expiresAt) {
    await store.delete(token);
    return null;
  }
  return record.siteId;
}

export async function deleteSession(token: string): Promise<void> {
  const store = getStore(SESSION_STORE);
  await store.delete(token);
}

// ---------------------------------------------------------------------------
// Cookie helpers — used by portal functions.
// ---------------------------------------------------------------------------

export function getSessionToken(req: Request): string | null {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)fs_session=([^;]+)/);
  return match ? match[1] : null;
}

export function buildSessionCookie(token: string): string {
  const isSecure = (process.env.URL ?? '').startsWith('https');
  return `fs_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_S}${isSecure ? '; Secure' : ''}`;
}

export function clearSessionCookie(): string {
  return 'fs_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}
