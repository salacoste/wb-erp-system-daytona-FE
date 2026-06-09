/**
 * FBO Orders Types
 * Types for FBO orders list, details, aggregation, sync, and backfill.
 *
 * Endpoints:
 *   GET  /v1/orders/fbo           — list FBO orders (paginated)
 *   GET  /v1/orders/fbo/:orderId  — single FBO order detail
 *   GET  /v1/orders/fbo/aggregate — aggregated FBO order stats
 *   POST /v1/orders/fbo/sync      — manual sync trigger
 *   GET  /v1/orders/fbo/sync-status — sync status
 *   POST /v1/orders/fbo/backfill  — historical backfill
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

// Sync, backfill, and query-param types extracted for file-size compliance
export type {
  FboOrdersSyncStatusResponse,
  FboOrdersSyncTriggerResponse,
  FboOrdersBackfillParams,
  FboOrdersBackfillResponse,
  FboOrdersListParams,
} from './orders-fbo-sync'

// =============================================================================
// Re-exports from sales-fbo.ts (backward compatibility)
// =============================================================================

export type { SaleFboItem, SalesFboListResponse, SalesFboAggregateResponse } from './sales-fbo'
