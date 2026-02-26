/**
 * Types for Epic 68: Funnel Analytics
 * Split from analytics-epics-68-71.ts for 200-line limit
 * Reference: docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md
 */

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
  openCardCount: number
  addToCartCount: number
  ordersCount: number
  ordersSumRub: number
  buyoutCount: number
  buyoutSumRub: number
  cancelCount: number
  cancelSumRub: number
  cartConversion: number
  orderConversion: number
  buyoutConversion: number
  cancelRate: number
  totalConversion: number
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
