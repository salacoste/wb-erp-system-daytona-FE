/**
 * COGS-history Boundary Normalizer — Validation F-37.
 *
 * GET /v1/cogs/history returns `unit_cost_rub` as a STRING ("500") in both the data
 * rows and `meta.current_cogs`, but `CogsHistoryItem.unit_cost_rub` is typed `number`
 * (a type-lie). Render paths happen to coerce it via Intl.NumberFormat, but
 * CogsEditDialog strict-compares the typed-number against a parsed number
 * (`parsedCost !== record.unit_cost_rub` → `500 !== "500"` → always true → Save enabled
 * on open for unchanged rows). Coercing at this boundary makes runtime match the type so
 * no component ever sees a string (Boundary Normalizer Pattern).
 *
 * `unit_cost_rub` is money — but the field is backend-contract non-null (every COGS
 * record has a cost), so a finite-number coercion is correct here. A genuinely
 * non-numeric/empty/null value (backend anomaly) maps to NaN (NOT 0 — `?? 0` on money
 * lies, anti-pattern #8); NaN is the honest "invalid" sentinel.
 */

import type { CogsHistoryResponse, CogsHistoryItem } from '@/types/cogs'
import { logger } from '@/lib/logger'

/**
 * Coerce a string|number money value to a number. Empty-string/null/undefined → NaN
 * (never 0 — that would fabricate a real 0 ₽ cost). Non-numeric strings → NaN.
 */
function toMoneyNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (value === null || value === undefined || value === '') return NaN
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

/**
 * Normalize a CogsHistoryResponse so `unit_cost_rub` is a number everywhere it appears
 * (data rows + meta.current_cogs). All other fields pass through unchanged.
 */
export function normalizeCogsHistoryResponse(raw: CogsHistoryResponse): CogsHistoryResponse {
  if (raw && !Array.isArray(raw.data)) {
    // Indicate rather than silently swallow a malformed shape (Defensive Frontend Principle).
    logger.warn('[F-37] normalizeCogsHistoryResponse: raw.data is not an array:', typeof raw.data)
  }
  const data: CogsHistoryItem[] = Array.isArray(raw?.data)
    ? raw.data.map(item => ({ ...item, unit_cost_rub: toMoneyNumber(item?.unit_cost_rub) }))
    : []

  const meta = raw?.meta
    ? {
        ...raw.meta,
        current_cogs: raw.meta.current_cogs
          ? {
              ...raw.meta.current_cogs,
              unit_cost_rub: toMoneyNumber(raw.meta.current_cogs.unit_cost_rub),
            }
          : raw.meta.current_cogs,
      }
    : raw?.meta

  return { ...raw, data, meta }
}
