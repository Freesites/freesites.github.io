// ---------------------------------------------------------------------------
// withRetry — wraps any async fn with exponential backoff (max 3 retries).
//
// Retries on:  network errors, HTTP 429, HTTP 5xx
// No retry on: HTTP 4xx (except 429) — these are caller errors, not transient
//
// Backoff:  1s → 2s → 4s  (baseDelayMs * 2^attempt)
// ---------------------------------------------------------------------------

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1_000;

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  // Override to control which errors are retried. Return true to retry.
  retryOn?: (err: unknown, attempt: number) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const retryOn = options.retryOn ?? defaultShouldRetry;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt >= maxRetries || !retryOn(err, attempt)) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  // TypeScript requires a return path — this is unreachable.
  throw lastError;
}

// ---------------------------------------------------------------------------
// defaultShouldRetry — retries on network errors, 429, and 5xx.
// Works with Anthropic SDK errors (have a .status property) and raw fetch
// Response objects, as well as plain Error objects for network failures.
// ---------------------------------------------------------------------------

function defaultShouldRetry(err: unknown): boolean {
  // AbortError or user-abort from AbortController — never retry.
  if (isAbortLike(err)) return false;

  if (err instanceof Error) {
    // SDK timeout error codes.
    const code = (err as { code?: string }).code;
    if (code === 'request_timed_out') return false;
    if (err.message.toLowerCase().includes('timed out')) return false;

    // Anthropic SDK / Resend SDK errors expose a numeric status property.
    const status = (err as { status?: number }).status;
    if (typeof status === 'number') {
      return status === 429 || status >= 500;
    }
    // Network-level errors (ECONNRESET, fetch failures) — retry once.
    return true;
  }
  return false;
}

// DOMException and Error both have a .name property; cover both.
function isAbortLike(err: unknown): boolean {
  if (err == null) return false;
  const name = (err as { name?: unknown }).name;
  return name === 'AbortError' || name === 'APIUserAbortError';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
