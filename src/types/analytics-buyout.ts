/**
 * Types for Epic 69: Buyout Analytics
 * Split from analytics-epics-68-71.ts for 200-line limit
 * Reference: docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md
 */

/**
 * Buyout/returns data source.
 *
 * - `'sdk_reconciliation'` — SDK-reconciled (highest fidelity, Epic 106 backend pipeline).
 * - `'weekly'` — weekly CSV report (lower fidelity, lower latency).
 * - `'realtime'` — live data (higher latency for SDK reconcile).
 * - `'blended'` — mixed-source heuristic (default fallback).
 * - `'unknown'` — fallback for unrecognized backend source values (Defensive Frontend Principle).
 *   Parity with `BuyoutReconciliationSource` (Story 96.14). SourceBadge renders AlertTriangle.
 *
 * Story 96.15-FE — `'sdk_reconciliation'` added (additive; no breaking changes).
 * Story 96.15-FE 1st-pass review fix M-3 — `'unknown'` added for Story 96.14 parity.
 */
export type BuyoutSource = 'weekly' | 'realtime' | 'blended' | 'sdk_reconciliation' | 'unknown'
export type BuyoutConfidence = 'high' | 'medium' | 'low'
export type TrendDirection = 'up' | 'down' | 'stable'

export interface BySkuBuyoutItem {
  nmId: number
  supplierArticle: string | null
  productName: string | null
  brand: string | null
  category?: string | null
  salesCount: number
  returnsCount: number
  buyoutRatePct: number | null
  returnRatePct?: number | null
  source?: BuyoutSource
  confidence?: BuyoutConfidence
  trend?: TrendDirection
  trendDelta?: number
  /** Which comparison week was used for trend calculation. null = no historical data */
  trendPeriod?: 'week-1' | 'week-2' | 'week-3' | 'week-4' | null
  previousBuyoutRatePct?: number | null
  /** Return breakdown: FBS has real categories, FBO only has total (estimated=true) */
  returnBreakdown?: {
    cancelBeforeShipment: number
    refusalAtPvz: number
    returnAfterReceipt: number
    total: number
    /** true = FBO data, categories unavailable; false = FBS, categories are real */
    estimated?: boolean
  } | null
}

export interface BySkuBuyoutResponse {
  data: BySkuBuyoutItem[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

export interface BuyoutSummaryResponse {
  overallBuyoutRatePct: number | null
  overallReturnRatePct: number | null
  totalSalesCount: number
  totalReturnsCount: number
  skuCount?: number
  topDecliners?: Array<{
    nmId: number
    buyoutRatePct: number | null
    // AP#8: trend delta is a ratio — number|null; null renders '—'.
    trendDelta: number | null
  }>
  period: { from: string; to: string }
  source: BuyoutSource
  confidence: BuyoutConfidence
}

/** Query params for GET /v1/analytics/buyout/by-sku */
export interface BuyoutBySkuParams {
  from: string
  to: string
  source?: BuyoutSource
  trend?: boolean
  nmId?: number
  minSales?: number
  sort?: 'buyoutRate' | 'salesCount' | 'returnRate' | 'trend'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/** Query params for GET /v1/analytics/buyout/summary */
export interface BuyoutSummaryParams {
  from: string
  to: string
  source?: BuyoutSource
}
