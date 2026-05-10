/**
 * Acquiring rate-limit helper — Story 96.9-FE
 *
 * Pure helper (not a React hook despite the `use-` file prefix, which follows
 * this repo's convention for files in `src/hooks/`). Classifies an error value
 * as a WB rate-limit event and surfaces the `Retry-After` seconds.
 *
 * The return type is a discriminated union so TypeScript forces callers to
 * narrow on `isRateLimited` before accessing `retryAfterSeconds` — eliminates
 * the class of bug where a caller reads `retryAfterSeconds` on a
 * non-rate-limited result (3rd-pass review fix L3-1, 2026-05-08).
 *
 * References:
 *   - request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.1
 *     (503 + Retry-After semantics for all 3 acquiring endpoints)
 *   - CLAUDE.md § "Defensive Frontend Principle":
 *     surface the rate-limit semantic, do NOT collapse it to "unknown error".
 *     We indicate; we do not transform.
 *
 * Used by all 3 acquiring orchestrators:
 *   - AcquiringPageContent (list)
 *   - AcquiringReportDetailPage (detail)
 *   - AcquiringPeriodDetailPage (period)
 */

import { ApiError } from '@/types/api'

export type AcquiringRateLimit =
  | { isRateLimited: false }
  | {
      isRateLimited: true
      /**
       * Seconds from the `Retry-After` response header; 60 when the header is
       * absent or non-numeric.
       *
       * Fallback of 60 sec matches typical WB upstream backoff window and ensures
       * the user sees a meaningful countdown rather than nothing.
       */
      retryAfterSeconds: number
    }

/**
 * Classify `error` as a WB rate-limit event.
 *
 * @param error - the `error` value from a TanStack Query hook result.
 * @returns AcquiringRateLimit discriminated union.
 *   - `{ isRateLimited: false }` — not a 503, or error is null/non-ApiError.
 *   - `{ isRateLimited: true, retryAfterSeconds: N }` — 503 with parsed or fallback seconds.
 */
export function getAcquiringRateLimit(error: unknown): AcquiringRateLimit {
  if (error == null) {
    return { isRateLimited: false }
  }
  if (!(error instanceof ApiError)) {
    return { isRateLimited: false }
  }
  if (error.status === 503) {
    return {
      isRateLimited: true,
      // Fallback 60 sec — see module doc above for rationale.
      retryAfterSeconds: error.retryAfter ?? 60,
    }
  }
  return { isRateLimited: false }
}
