/**
 * Types for Epics 68-71: Funnel / Buyout / Returns Analytics
 * Reference: docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md
 */

// ============================================================
// Epic 68: Funnel Analytics
// ============================================================

export interface FunnelProductItem {
  nmId: number
  vendorCode?: string
  brandName?: string
  openCardCount: number
  addToCartCount: number
  ordersCount: number
  buyoutCount: number
  cancelCount: number
  cartConversion: number
  orderConversion: number
  buyoutConversion: number
  cancelRate: number
  totalConversion: number
}

export interface FunnelDayItem {
  date: string
  openCardCount: number
  addToCartCount: number
  ordersCount: number
  buyoutCount: number
  cancelCount: number
  totalConversion: number
}

export interface FunnelSummary {
  avgCartConversion?: number
  avgOrderConversion?: number
  avgBuyoutConversion?: number
  avgCancelRate?: number
  avgTotalConversion: number
  totalOpenCards: number
  totalOrders: number
  totalBuyouts: number
}

export interface FunnelPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface FunnelResponse {
  items: (FunnelProductItem | FunnelDayItem)[]
  summary: FunnelSummary
  pagination: FunnelPagination
}

export interface FunnelSyncStatus {
  lastSyncAt: string | null
  recordsCount: number
  productsCount: number
}

/** Query params for GET /v1/analytics/funnel */
export interface FunnelParams {
  from: string
  to: string
  groupBy?: 'product' | 'day'
  nmIds?: number[]
  sort?: 'openCardCount' | 'ordersCount' | 'buyoutCount' | 'totalConversion' | 'cancelRate'
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ============================================================
// Epic 69: Buyout Analytics
// ============================================================

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
    currentBuyoutRate: number | null
    previousBuyoutRate: number | null
    declinePct: number
  }>
  period: { from: string; to: string }
  source: string
  confidence: string
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

// ============================================================
// Epic 71: Return Analytics
// ============================================================

export type ReturnCategory = 'cancel_before_shipment' | 'refusal_at_pvz' | 'return_after_receipt'

export interface ReturnCategoryItem {
  category: ReturnCategory
  displayName: string
  count: number
  percentage: number
  trend: TrendDirection
  trendDelta: number
}

export interface ReturnReasonsResponse {
  summary: {
    totalReturns: number
    cancelBeforeShipment: number
    refusalAtPvz: number
    returnAfterReceipt: number
    overallReturnRate: number
    classificationCoverage: number
  }
  byCategory: ReturnCategoryItem[]
  period: { from: string; to: string }
}

export interface BySkuReturnItem {
  nmId: number
  productName: string
  brand: string
  totalReturns: number
  returnRate: number
  cancelBeforeShipment: number
  refusalAtPvz: number
  returnAfterReceipt: number
  anomalyFlag: boolean
}

export interface BySkuReturnResponse {
  data: BySkuReturnItem[]
  pagination: { count: number; hasMore: boolean; nextCursor?: string }
  summary: { totalSkus: number; anomalyCount: number }
}

/** Query params for GET /v1/analytics/returns/reasons */
export interface ReturnReasonsParams {
  cabinetId: string
  from?: string
  to?: string
  locale?: 'ru' | 'en'
}

/** Query params for GET /v1/analytics/returns/reasons/by-sku */
export interface ReturnsBySkuParams {
  cabinetId: string
  from?: string
  to?: string
  nmId?: number
  anomalyOnly?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  cursor?: string
}
