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

/** Metrics for a single fulfillment type (FBO or FBS) */
export interface FulfillmentMetrics {
  ordersCount: number
  ordersRevenue: number
  salesCount: number
  salesRevenue: number
  forPayTotal: number
  returnsCount: number
  returnsRevenue: number
  returnRate: number
  avgOrderValue: number
}

/** Aggregated totals with FBO/FBS share percentages */
export interface FulfillmentTotal {
  ordersCount: number
  ordersRevenue: number
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

/** @deprecated Use StartFulfillmentSyncRequest instead */
export type StartSyncRequest = StartFulfillmentSyncRequest

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
