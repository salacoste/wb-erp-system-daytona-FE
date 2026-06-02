/**
 * Bulk-COGS Boundary Normalizer — Validation F-34.
 *
 * `POST /v1/products/cogs/bulk?format=v2` is SUPPOSED to return the v2 envelope
 * `{ data: { succeeded, failed, results[], message, marginRecalculation? } }`, but it
 * currently ignores `format=v2` and returns the LEGACY shape
 * `{ totalItems, createdItems, skippedItems, errors[] }` (backend request #186).
 * The old hook read `response.data.succeeded` on the apiClient-unwrapped result and
 * crashed with a TypeError on every upload — AFTER the server had already created the
 * COGS, so the user saw an error toast for a successful upload (duplicate-retry risk).
 *
 * This normalizer maps BOTH shapes to the canonical BulkCogsResultSummary so the hooks
 * never touch raw backend shapes (Boundary Normalizer Pattern). `marginRecalculation`
 * is only available from the v2 shape; on legacy it is undefined until #186 lands.
 */

import type { BulkCogsResultSummary, BulkCogsResult, MarginRecalculationStatus } from '@/types/api'

/** Coerce to a finite count → 0 fallback (anti-pattern #8 allows `?? 0` on counts). */
function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * Normalize the bulk-COGS upload response (v2 OR legacy) into BulkCogsResultSummary.
 * Accepts the apiClient-unwrapped value; also descends a surviving `{ data }` wrapper
 * defensively (in case a future caller passes the un-unwrapped envelope).
 */
export function normalizeBulkCogsResponse(raw: unknown): BulkCogsResultSummary {
  const root = (raw ?? {}) as Record<string, unknown>
  const o =
    root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root

  // v2 shape: { succeeded, failed, results[], message, marginRecalculation? }
  if ('succeeded' in o || 'results' in o) {
    return {
      succeeded: toCount(o.succeeded),
      failed: toCount(o.failed),
      results: Array.isArray(o.results) ? (o.results as BulkCogsResult[]) : [],
      message: typeof o.message === 'string' ? o.message : '',
      marginRecalculation:
        (o.marginRecalculation as MarginRecalculationStatus | undefined) ?? undefined,
    }
  }

  // Legacy shape: { totalItems, createdItems, skippedItems, errors[{ nm_id, error }] }.
  // errors[] enumerates only FAILED items → map to results with success:false (the
  // retry-failed-only UX filters on !success). Succeeded items aren't enumerated by the
  // legacy shape, so `results` carries failures only; `succeeded` is the count.
  const errors = Array.isArray(o.errors) ? (o.errors as Array<Record<string, unknown>>) : []
  return {
    succeeded: toCount(o.createdItems),
    failed: toCount(o.skippedItems),
    results: errors.map(e => ({
      nm_id: String(e.nm_id ?? ''),
      success: false,
      error_message: typeof e.error === 'string' ? e.error : undefined,
    })),
    message: '',
    marginRecalculation: undefined,
  }
}
