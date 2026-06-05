/**
 * Bulk-COGS Boundary Normalizer — Validation F-34 + Request #186 v2.
 *
 * `POST /v1/products/cogs/bulk?format=v2` returns the v2 envelope
 * `{ data: { succeeded, failed, results[], message, marginRecalculation? } }`.
 * The legacy shape `{ totalItems, createdItems, skippedItems, errors[] }` is also handled.
 *
 * This normalizer maps BOTH shapes to the canonical BulkCogsResultSummary so the hooks
 * never touch raw backend shapes (Boundary Normalizer Pattern). `marginRecalculation`
 * is only available from the v2 shape (Request #186 resolved 2026-06-04).
 */

import type { BulkCogsResultSummary, BulkCogsResult, MarginRecalculationStatus } from '@/types/api'
import { toCount, toStringOrNull } from '@/lib/api/normalizer-helpers'

/** Map raw backend marginRecalculation to canonical FE shape (Request #186 v2). */
function normalizeMarginRecalculation(raw: unknown): MarginRecalculationStatus | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const m = raw as Record<string, unknown>
  const triggered = typeof m.triggered === 'boolean' ? m.triggered : false
  const affectedWeeks = Array.isArray(m.affectedWeeks)
    ? m.affectedWeeks.filter((w): w is string => typeof w === 'string')
    : []
  const taskUuid = toStringOrNull(m.taskUuid)
  if (!taskUuid) return undefined
  return { triggered, affectedWeeks, taskUuid }
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
      marginRecalculation: normalizeMarginRecalculation(o.marginRecalculation),
    }
  }

  // Legacy shape: { totalItems, createdItems, skippedItems, errors[] }.
  // iter-69: the live backend error items are `{ index, nmId, code, message }` (camelCase) —
  // confirmed in cogs.service.ts `result.errors.push`. The old map read `e.nm_id`/`e.error`
  // (never present) → every failed-item row rendered a BLANK nmId + empty message. Read both the
  // real camelCase fields and the legacy snake fallbacks.
  // errors[] enumerates only FAILED items → map to results with success:false (the
  // retry-failed-only UX filters on !success). Succeeded items aren't enumerated by the
  // legacy shape, so `results` carries failures only; `succeeded` is the count.
  const errors = Array.isArray(o.errors) ? (o.errors as Array<Record<string, unknown>>) : []
  return {
    succeeded: toCount(o.createdItems),
    // iter-69: the backend NEVER increments `skippedItems` on this path (it stays 0); failed items
    // are enumerated in `errors[]`. The old `failed: skippedItems` was therefore always 0, which
    // gated the dialog's failed-items table + retry button (failed>0) shut — so the mapped error
    // rows never rendered and partial failures showed a green "success" toast. Mirror the backend's
    // canonical v2 formula (cogs.service.ts:1019): failed = skippedItems + errors.length.
    failed: toCount(o.skippedItems) + errors.length,
    results: errors.map(e => ({
      nm_id: String(e.nmId ?? e.nm_id ?? ''),
      success: false,
      error_code: typeof e.code === 'string' ? e.code : undefined,
      error_message:
        typeof e.message === 'string'
          ? e.message
          : typeof e.error === 'string'
            ? e.error
            : undefined,
    })),
    message: '',
    marginRecalculation: undefined,
  }
}
