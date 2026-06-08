/**
 * Fulfillment (FBO/FBS) Analytics Types
 * Epic 60: FBO/FBS Order Analytics Separation
 *
 * Endpoints:
 * - GET /v1/analytics/fulfillment/summary
 * - GET /v1/analytics/fulfillment/trends
 *
 * Sync & products types live in fulfillment-sync-types.ts.
 *
 * @see docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md
 */

// Re-export sync & products types for backward compatibility
export type {
  SyncDataInfo,
  AggregationStatus,
  FulfillmentSyncStatusResponse,
  FulfillmentDataSource,
  StartFulfillmentSyncRequest,
  StartFulfillmentSyncResponse,
  FulfillmentProductMetrics,
  FulfillmentProductItem,
  FulfillmentProductsResponse,
} from './fulfillment-sync-types'

// =============================================================================
// API Parameters
// =============================================================================

/** Parameters for GET /v1/analytics/fulfillment/summary */
export interface FulfillmentSummaryParams {
  from: string
  to: string
}

/** Parameters for GET /v1/analytics/fulfillment/trends */
export interface FulfillmentTrendsParams {
  from: string
  to: string
  type?: 'fbo' | 'fbs' | 'all'
  metric?: 'orders' | 'sales' | 'revenue' | 'returns'
}

/** Parameters for GET /v1/analytics/fulfillment/products */
export interface FulfillmentProductsParams {
  from: string
  to: string
  page?: number
  limit?: number
}

// =============================================================================
// Summary Response Types
// =============================================================================

/** Return reasons breakdown from return_classifications (FBS only) */
export interface ReturnBreakdown {
  cancelBeforeShipment: number
  refusalAtPvz: number
  returnAfterReceipt: number
  total: number
  classificationCoverage: number
}

/**
 * Metrics for a single fulfillment type (FBO or FBS)
 *
 * WB Price Chain:
 * ordersRevenue (РРЦ) → ordersRevenueDiscounted (цена на карточке) → salesRevenue (выкупы)
 */
export interface FulfillmentMetrics {
  ordersCount: number // Количество заказов (шт)
  ordersRevenue: number // РРЦ — полная цена каталога
  ordersRevenueDiscounted: number // Цена на карточке WB (база для комиссии)
  salesCount: number // Количество выкупов (шт)
  salesRevenue: number // Выкупы — деньги от выкупленных товаров
  forPayTotal: number // К перечислению
  returnsCount: number // Количество возвратов (шт)
  returnsRevenue: number // Возвраты — деньги за возвращённые товары
  returnRate: number // % возвратов от выкупов
  avgOrderValue: number // Средний чек
  returnBreakdown?: ReturnBreakdown | null
}

/** Aggregated totals with FBO/FBS share percentages */
export interface FulfillmentTotal {
  ordersCount: number
  ordersRevenue: number
  ordersRevenueDiscounted: number
  fboShare: number
  fbsShare: number
}

/** Response from GET /v1/analytics/fulfillment/summary */
export interface FulfillmentSummaryResponse {
  summary: {
    fbo: FulfillmentMetrics
    fbs: FulfillmentMetrics
    total: FulfillmentTotal
  }
  period: { from: string; to: string }
}

// =============================================================================
// Trends Response Types
// =============================================================================

/** Daily metrics for a single fulfillment type */
export interface FulfillmentDayMetrics {
  ordersCount: number
  ordersRevenue: number
  salesRevenue: number
  returnsCount: number
}

/** Single day trend item with FBO/FBS breakdown */
export interface FulfillmentTrendItem {
  date: string
  fbo: FulfillmentDayMetrics
  fbs: FulfillmentDayMetrics
}

/** Response from GET /v1/analytics/fulfillment/trends */
export interface FulfillmentTrendsResponse {
  trends: FulfillmentTrendItem[]
  period: { from: string; to: string; daysIncluded: number }
}
