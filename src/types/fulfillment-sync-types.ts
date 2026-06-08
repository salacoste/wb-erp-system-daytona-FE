/**
 * Fulfillment Sync & Products Types
 * Extracted from fulfillment.ts for file-size compliance.
 *
 * @see fulfillment.ts for summary and trends types
 */

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
