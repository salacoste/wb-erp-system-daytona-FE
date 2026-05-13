/**
 * Fulfillment (FBO/FBS) Analytics Types
 * Epic 60: FBO/FBS Order Analytics Separation
 *
 * Endpoints:
 * - GET /v1/analytics/fulfillment/summary
 * - GET /v1/analytics/fulfillment/trends
 * - GET /v1/analytics/fulfillment/sync-status
 * - POST /v1/admin/fulfillment/sync
 * - GET /v1/analytics/fulfillment/products
 *
 * @see docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md
 */

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

// =============================================================================
// Sync Status Response Types
// =============================================================================

/** Sync information for a data source (orders or sales) */
export interface SyncDataInfo {
  lastSyncAt: string
  recordsCount: number
  dateRange: { from: string; to: string }
}

/** Aggregation job status */
export type AggregationStatus = 'pending' | 'in_progress' | 'complete' | 'failed'

/** Response from GET /v1/analytics/fulfillment/sync-status */
export interface FulfillmentSyncStatusResponse {
  orders: SyncDataInfo | null
  sales: SyncDataInfo | null
  aggregation: { lastRunAt: string; status: AggregationStatus } | null
  isDataAvailable: boolean
}

// =============================================================================
// Start Sync Request/Response Types (Admin)
// =============================================================================

/** Data source options for sync */
export type FulfillmentDataSource = 'orders' | 'sales' | 'both'

/** Request body for POST /v1/admin/fulfillment/sync */
export interface StartFulfillmentSyncRequest {
  dataSource: FulfillmentDataSource
  dateFrom?: string
  dateTo?: string
}

/** Response from POST /v1/admin/fulfillment/sync */
export interface StartFulfillmentSyncResponse {
  success: boolean
  message: string
  jobId: string
  estimatedTime: string
}

// =============================================================================
// Products Response Types
// =============================================================================

/** Per-product metrics for a single fulfillment type */
export interface FulfillmentProductMetrics {
  ordersCount: number
  salesRevenue: number
  returnsCount: number
  returnRate: number
}

/** Single product item with FBO/FBS breakdown */
export interface FulfillmentProductItem {
  nmId: number
  supplierArticle: string
  category: string
  brand: string
  fbo: FulfillmentProductMetrics
  fbs: FulfillmentProductMetrics
  recommendation?: string
}

/** Response from GET /v1/analytics/fulfillment/products */
export interface FulfillmentProductsResponse {
  products: FulfillmentProductItem[]
  total: number
  period: { from: string; to: string }
}
