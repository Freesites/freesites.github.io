import { withRetry } from '../utils/retry';

// ---------------------------------------------------------------------------
// Health check — verifies the deployed site is reachable and contains the
// business name. Both checks must pass to mark a deploy healthy.
//
// A failed health check does NOT abort the deployment record — the site is
// still marked 'deployed' but healthCheckPassed is recorded as false. This
// lets the operator investigate without requiring a full redeployment.
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 15_000; // 15 seconds

export interface HealthCheckResult {
  passed: boolean;
  statusCode: number | null;
  containsBusinessName: boolean;
  error: string | null;
}

export async function runHealthCheck(
  deployedUrl: string,
  businessName: string,
): Promise<HealthCheckResult> {
  let response: Response;
  let body: string;

  try {
    // Retry on network errors only — a non-200 status is a valid result, not transient.
    response = await withRetry(
      () => fetch(deployedUrl, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': 'FreeSites-HealthCheck/1.0' },
      }),
      { retryOn: (err) => err instanceof Error && !('status' in err) },
    );
    body = await response.text();
  } catch (err) {
    return {
      passed: false,
      statusCode: null,
      containsBusinessName: false,
      error: String(err),
    };
  }

  const statusOk = response.status === 200;
  // Case-insensitive check — HTML may encode the name differently.
  const containsBusinessName =
    businessName.trim().length > 0 &&
    body.toLowerCase().includes(businessName.toLowerCase());

  return {
    passed: statusOk && containsBusinessName,
    statusCode: response.status,
    containsBusinessName,
    error: null,
  };
}
