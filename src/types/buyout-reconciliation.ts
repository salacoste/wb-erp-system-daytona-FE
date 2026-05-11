import type { BuyoutSource } from './analytics-buyout'

/**
 * Buyout Reconciliation — TypeScript types — Epic 96-FE Story 96.14-FE
 *
 * Corresponds to backend endpoint (Epic 106 / request-backend/169 § 1.3):
 *   GET /v1/analytics/buyout/reconciliation?from=&to=&nmId=
 *
 * Backend may deliver snake_case; the Boundary Normalizer (buyout-reconciliation-normalizer.ts)
 * bridges to camelCase at the API boundary. NEVER use raw backend shapes in
 * components or hooks. See CLAUDE.md § Boundary Normalizer Pattern.
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 *   All anomaly count fields and quantity fields are `number` (0 is legitimate — zero anomalies is success).
 *   String fields (productName, brand, source) are `string` (empty string fallback in normalizer).
 *
 * @see src/lib/api/buyout-reconciliation-normalizer.ts
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.3
 */

// ---------------------------------------------------------------------------
// Source enum
// ---------------------------------------------------------------------------

/**
 * Data source for the reconciliation record.
 * Aliased from BuyoutSource (analytics-buyout.ts) — same 5-variant union,
 * single definition to maintain. 'unknown' is the normalizer fallback for
 * unrecognized backend values.
 *
 * Type alias (not re-export) — re-export syntax `export type { X as Y } from`
 * does not create a local binding, causing TS2304 at usage sites.
 */
export type ReconciliationSource = BuyoutSource

// ---------------------------------------------------------------------------
// Per-row item shape
// ---------------------------------------------------------------------------

/** One SKU row from GET /v1/analytics/buyout/reconciliation */
export interface ReconciliationItem {
  nmId: number
  productName: string
  brand: string
  /** Total confirmed buyouts in the period */
  buyoutQuantity: number
  /** Total returns in the period */
  returnQuantity: number
  /** Returns with no matching buyout event — anomaly indicator if > 0 */
  returnWithoutBuyout: number
  /** Buyouts with no matching original order — anomaly indicator if > 0 */
  orphanBuyout: number
  /** Qty mismatch between SDK reconciliation and weekly report — anomaly indicator if > 0 */
  returnQuantityMismatch: number
  /** Data source used for this row's reconciliation */
  source: ReconciliationSource
}

// ---------------------------------------------------------------------------
// Envelope response shape
// ---------------------------------------------------------------------------

/** Normalized response for GET /v1/analytics/buyout/reconciliation */
export interface BuyoutReconciliationResponse {
  data: ReconciliationItem[]
  period: { from: string; to: string }
  generatedAt: string // ISO datetime — empty string if backend omits
}

// ---------------------------------------------------------------------------
// Param shape
// ---------------------------------------------------------------------------

export interface BuyoutReconciliationParams {
  from: string // ISO date
  to: string // ISO date
  nmId?: number // optional WB article filter (positive integer)
}
