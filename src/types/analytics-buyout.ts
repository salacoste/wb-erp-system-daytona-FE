/**
 * Types for Epic 69: Buyout Analytics
 * Split from analytics-epics-68-71.ts for 200-line limit
 * Reference: docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md
 */

export type BuyoutSource = 'weekly' | 'realtime' | 'blended'
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
  previousBuyoutRatePct?: number | null
  /** Return breakdown from return_classifications (FBS only), joined by backend */
  returnBreakdown?: {
    cancelBeforeShipment: number
    refusalAtPvz: number
    returnAfterReceipt: number
    total: number
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
    trendDelta: number
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
