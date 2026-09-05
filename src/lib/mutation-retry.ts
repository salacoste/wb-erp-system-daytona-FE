/**
 * Mutation retry predicate for the global QueryClient defaults (debt FE-D1).
 *
 * The previous global default `mutations: { retry: 1 }` blindly re-issued
 * EVERY failed mutation once — including 4xx client errors, which are
 * permanent (a WB-token PUT rejected with 400 was sent twice; see the
 * e2e note in e2e/onboarding.spec.ts [WB-TOKEN-BROWSER-02]). Retrying 4xx
 * wastes traffic, accelerates backend throttling (login is capped at 5/hour)
 * and misleads users with duplicated error handling. 429 Retry-After UX is
 * owned by the UI layer (e.g. RateLimitWarning), not by blind re-tries.
 *
 * Semantics: `failureCount >= 1` keeps the historical retry:1 cap (at most
 * ONE automatic retry); 4xx ApiError is never retried; everything else
 * (5xx, network failures, unknown values) retries once. NOTE: network
 * failures arrive as `ApiError` with status 0 — api-client.ts wraps fetch
 * throwables in its request catch (`throw new ApiError(msg, 0, error)`), so
 * a bare TypeError rarely reaches this predicate; the TypeError test below
 * is a defense-in-depth form, not the primary contract.
 *
 * The predicate can only classify errors that KEEP their ApiError type —
 * mapped re-throws (e.g. api-wb-token-errors.ts) must re-throw the class
 * with the original status (pinned by api-wb-token-errors.test.ts).
 */

import { ApiError } from '@/types/api'

export function shouldRetryMutation(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return true
}
