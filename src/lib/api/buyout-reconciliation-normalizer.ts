/**
 * Buyout Reconciliation — Boundary Normalizer — Epic 96-FE Story 96.14-FE
 *
 * Normalizes raw backend responses from the reconciliation endpoint into the
 * frontend-canonical shape defined in src/types/buyout-reconciliation.ts.
 *
 * Responsibilities:
 *   - snake_case → camelCase via dual-lookup on every field (per Story 88.4 pattern).
 *   - Null-vs-zero: count fields coerced to 0 (counts; 0 is legitimate — zero anomalies = success).
 *   - NaN guard on all numeric conversions via Number.isFinite.
 *   - String coercion to '' on missing values (prevents runtime crashes).
 *   - Source enum coercion: unrecognized values → 'unknown' (defensive sentinel).
 *
 * @see src/types/buyout-reconciliation.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 * @see CLAUDE.md anti-pattern #8 (null-vs-zero)
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.3
 */

import type {
  ReconciliationItem,
  BuyoutReconciliationResponse,
  ReconciliationSource,
} from '@/types/buyout-reconciliation'

// ---------------------------------------------------------------------------
// Private scalar helpers
// ---------------------------------------------------------------------------

/** Converts to number (count / ID). Returns 0 on missing or non-finite input. */
function toCount(raw: unknown): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** Returns '' for null/undefined. */
function toStr(raw: unknown): string {
  return raw == null ? '' : String(raw)
}

// ---------------------------------------------------------------------------
// Source enum coercion
// ---------------------------------------------------------------------------

const VALID_SOURCES: ReadonlySet<ReconciliationSource> = new Set([
  'sdk_reconciliation',
  'weekly',
  'realtime',
  'blended',
  'unknown',
])

/**
 * Coerces raw backend source string to ReconciliationSource.
 * Unrecognized values fall back to 'unknown' (defensive sentinel per Boundary Normalizer Pattern).
 */
function toSource(raw: unknown): ReconciliationSource {
  const s = String(raw ?? '')
  return VALID_SOURCES.has(s as ReconciliationSource) ? (s as ReconciliationSource) : 'unknown'
}

// ---------------------------------------------------------------------------
// Private item normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes one ReconciliationItem row.
 * Dual-lookup on every field absorbs camelCase/snake_case backend drift.
 */
function normalizeReconciliationItem(raw: unknown): ReconciliationItem {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    nmId: toCount(d.nmId ?? d.nm_id),
    productName: toStr(d.productName ?? d.product_name),
    brand: toStr(d.brand),
    buyoutQuantity: toCount(d.buyoutQuantity ?? d.buyout_quantity ?? d.buyoutCount),
    returnQuantity: toCount(d.returnQuantity ?? d.return_quantity ?? d.returnCount),
    returnWithoutBuyout: toCount(d.returnWithoutBuyout ?? d.return_without_buyout),
    orphanBuyout: toCount(d.orphanBuyout ?? d.orphan_buyout),
    returnQuantityMismatch: toCount(d.returnQuantityMismatch ?? d.return_quantity_mismatch),
    source: toSource(d.source),
  }
}

// ---------------------------------------------------------------------------
// Exported normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes the full reconciliation-endpoint envelope.
 * Input: raw `{ data: [...], period, generatedAt }` from apiClient (skipDataUnwrap: true).
 *
 * Backend resolved in Epic 106 (request #169 § 1.3); endpoint live. Normalizer kept per Boundary Normalizer Pattern.
 * Backend delivers data via GET /v1/analytics/buyout/reconciliation.
 */
export function normalizeBuyoutReconciliationResponse(raw: unknown): BuyoutReconciliationResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const dataRaw = Array.isArray(r.data) ? r.data : []
  const period = (r.period ?? {}) as Record<string, unknown>
  return {
    data: dataRaw.map(normalizeReconciliationItem),
    period: {
      from: toStr(period.from),
      to: toStr(period.to),
    },
    generatedAt: toStr(r.generatedAt ?? r.generated_at),
  }
}
