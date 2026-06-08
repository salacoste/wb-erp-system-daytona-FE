/**
 * FBO Orders & Sales Types
 * Types for FBO orders list, details, aggregation, sync, and FBO sales.
 *
 * Endpoints:
 *   GET  /v1/orders/fbo           — list FBO orders (paginated)
 *   GET  /v1/orders/fbo/:orderId  — single FBO order detail
 *   GET  /v1/orders/fbo/aggregate — aggregated FBO order stats
 *   POST /v1/orders/fbo/sync      — manual sync trigger
 *   GET  /v1/orders/fbo/sync-status — sync status
 *   POST /v1/orders/fbo/backfill  — historical backfill
 *   GET  /v1/sales/fbo            — FBO sales list
 *   GET  /v1/sales/fbo/aggregate  — FBO sales aggregation
 */

// =============================================================================
// FBO Order Item
// =============================================================================

/** Single FBO order row (list & detail responses share this shape) */
export interface OrderFboItem {
  /** Internal UUID */
  id: string
  /** WB order ID (numeric string for BigInt compatibility) */
  orderId: string
  /** SR ID (WB supply request identifier) */
  srid: string
  /** WB Article (SKU) */
  nmId: number
  /** Supplier article code */
  supplierArticle: string
  /** Barcode */
  barcode: string | null
  /** Brand name */
  brand: string
  /** Product subject / name */
  subject: string
  /** Product category */
  category: string | null
  /** Original price (RUB) */
  totalPrice: number
  /** Discount percentage */
  discountPercent: number
  /** SPP (Smart Pricing Percentage) */
  spp: number | null
  /** Final price after discount and SPP (RUB) */
  finishedPrice: number
  /** Price with discount only (RUB) */
  priceWithDisc: number
  /** Warehouse name */
  warehouseName: string
  /** Region name */
  regionName: string | null
  /** Order date */
  orderDate: string
  /** Whether order is cancelled */
  isCancel: boolean
  /** Record creation timestamp */
  createdAt: string
  /** Record update timestamp */
  updatedAt: string
}

/** Extended FBO order detail (GET /v1/orders/fbo/:orderId) */
export interface OrderFboDetail extends OrderFboItem {
  /** Delivery date (only in detail response) */
  deliveryDate: string | null
  /** Country name (only in detail response) */
  countryName: string | null
}

// =============================================================================
// FBO Order List Response
// =============================================================================

/** Pagination metadata */
export interface FboOrdersPagination {
  total: number
  limit: number
  offset: number
}

/** Response from GET /v1/orders/fbo */
export interface FboOrdersListResponse {
  items: OrderFboItem[]
  pagination: FboOrdersPagination
}

// =============================================================================
// FBO Order Aggregate
// =============================================================================

/** Date range bucket in aggregate response */
export interface FboAggregateDateRange {
  from: string | null
  to: string | null
}

/** Response from GET /v1/orders/fbo/aggregate */
export interface FboOrdersAggregateResponse {
  /** Total order count */
  count: number
  /** Sum of totalPrice across all orders (RUB) */
  totalPrice: number
  /** Sum of finishedPrice across all orders (RUB) */
  totalFinishedPrice: number
  /** Average order price (RUB) */
  avgPrice: number | null
  /** Average finished price (RUB) */
  avgFinishedPrice: number | null
  /** Count of cancelled orders */
  cancelledCount: number
  /** Cancel rate (0-100) */
  cancelRate: number | null
  /** Date range of the aggregation */
  dateRange: FboAggregateDateRange
}

// =============================================================================
// FBO Orders Sync
// =============================================================================

/** Response from GET /v1/orders/fbo/sync-status */
export interface FboOrdersSyncStatusResponse {
  /** Whether sync is enabled */
  enabled: boolean
  /** Schedule description (e.g., "Every 15 minutes") */
  schedule: string
  /** Timezone for the schedule */
  timezone: string
}

/** Response from POST /v1/orders/fbo/sync */
export interface FboOrdersSyncTriggerResponse {
  /** Job ID for tracking */
  jobId: string
  /** Confirmation message */
  message: string
  /** Job priority */
  priority: string
}

/** Request body for POST /v1/orders/fbo/backfill */
export interface FboOrdersBackfillParams {
  /** Start date YYYY-MM-DD */
  dateFrom: string
  /** End date YYYY-MM-DD */
  dateTo: string
}

/** Response from POST /v1/orders/fbo/backfill */
export interface FboOrdersBackfillResponse {
  jobId: string
  message: string
}

// =============================================================================
// FBO Sales
// =============================================================================

/** Single FBO sale row */
export interface SaleFboItem {
  /** Internal UUID */
  id: string
  /** SR ID */
  srid: string
  /** Order detail ID */
  odid: number
  /** WB Article (SKU) */
  nmId: number
  /** Supplier article code */
  supplierArticle: string
  /** Brand name */
  brand: string
  /** Product subject / name */
  subject: string
  /** Product category */
  category: string | null
  /** Final sale price (RUB) */
  finishedPrice: number
  /** Amount for payment to seller (RUB) */
  forPay: number
  /** Whether this is a storno (reversal) record */
  isStorno: boolean
  /** Sale date */
  saleDate: string
  /** Warehouse name */
  warehouseName: string
  /** Region name */
  regionName: string | null
  /** Record creation timestamp */
  createdAt: string
}

/** Response from GET /v1/sales/fbo */
export interface SalesFboListResponse {
  items: SaleFboItem[]
  pagination: FboOrdersPagination
}

/** Response from GET /v1/sales/fbo/aggregate */
export interface SalesFboAggregateResponse {
  /** Total sales count */
  count: number
  /** Sum of finishedPrice (RUB) */
  totalFinishedPrice: number
  /** Sum of forPay (RUB) */
  totalForPay: number
  /** Count of returns (storno records) */
  returnsCount: number
  /** Revenue lost to returns (RUB) */
  returnsRevenue: number | null
  /** Return rate (0-100) */
  returnRate: number | null
  /** Average sale value (RUB) */
  avgSaleValue: number | null
  /** Date range of the aggregation */
  dateRange: FboAggregateDateRange
}

// =============================================================================
// Query Parameters
// =============================================================================

/** Query parameters for GET /v1/orders/fbo and GET /v1/sales/fbo */
export interface FboOrdersListParams {
  /** Start date YYYY-MM-DD */
  from?: string
  /** End date YYYY-MM-DD */
  to?: string
  /** Filter by nm_id */
  nm_id?: number
  /** Sort field */
  sort_by?: string
  /** Sort direction */
  sort_order?: 'asc' | 'desc'
  /** Items per page (1-1000, default 100) */
  limit?: number
  /** Pagination offset */
  offset?: number
}
