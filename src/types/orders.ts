/**
 * Orders Types
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Core types for FBS orders list, details, and sync operations.
 */

// --- Status Types ---

/** Seller-side order status (Статус продавца) */
export type SupplierStatus = 'new' | 'confirm' | 'complete' | 'cancel'

/** WB-side order status (Статус WB) */
export type WbStatus = 'waiting' | 'sorted' | 'sold' | 'canceled' | 'canceled_by_client' | 'defect'

// --- Order Item Types ---

/** Order item in list view (GET /v1/orders) */
export interface OrderFbsItem {
  /** WB Order ID (string for BigInt compatibility) */
  orderId: string
  /** Order grouping UID */
  orderUid: string
  /** WB Article (SKU) */
  nmId: number
  /** Supplier article code */
  vendorCode: string
  /** Product name (enriched from products table) */
  productName: string | null
  /** Original price (RUB) */
  price: number
  /** Sale price after discount (RUB) */
  salePrice: number
  /** Seller-side status */
  supplierStatus: SupplierStatus
  /** WB-side status */
  wbStatus: WbStatus
  /** WB warehouse ID */
  warehouseId: number
  /** Delivery type (e.g., "fbs") */
  deliveryType: string
  /** B2B order flag */
  isB2B: boolean
  /** Cargo type (MGT/SGT/KGT+) */
  cargoType: string | null
  /** Order creation timestamp */
  createdAt: string
  /** Last status change timestamp */
  statusUpdatedAt: string
}

/** Delivery address info (Адрес доставки) */
export interface OrderAddress {
  /** Full address string */
  fullAddress: string | null
  /** Longitude coordinate */
  longitude: number | null
  /** Latitude coordinate */
  latitude: number | null
}

/** Brief status history entry in order details */
export interface StatusHistoryBrief {
  supplierStatus: SupplierStatus
  wbStatus: WbStatus
  changedAt: string
}

/** Extended order details (GET /v1/orders/:orderId) */
export interface OrderFbsDetails extends OrderFbsItem {
  /** Size/variant ID */
  chrtId: number
  /** Delivery address (optional) */
  address: OrderAddress | null
  /** Brief status history (newest first) */
  statusHistory: StatusHistoryBrief[]
  /** Processing time since creation (seconds) */
  processingTimeSeconds: number
  /** Last sync timestamp */
  syncedAt: string
}

// --- Pagination & Query Types ---

/** Offset-based pagination for orders */
export interface OrdersPagination {
  /** Total number of items */
  total: number
  /** Items per page */
  limit: number
  /** Current offset */
  offset: number
}

/** Query info in response */
export interface OrdersQueryInfo {
  /** Filter start date */
  from: string | null
  /** Filter end date */
  to: string | null
}

// --- Response Types ---

/** Response from GET /v1/orders */
export interface OrdersListResponse {
  items: OrderFbsItem[]
  pagination: OrdersPagination
  query: OrdersQueryInfo
}

/** Response from POST /v1/orders/sync */
export interface TriggerSyncResponse {
  jobId: string
  message: string
}

/** Response from GET /v1/orders/sync-status */
export interface SyncStatusResponse {
  enabled: boolean
  lastSyncAt: string | null
  nextSyncAt: string | null
  schedule: string
  timezone: string
}

// --- Query Parameter Types ---

/** Query parameters for GET /v1/orders */
export interface OrdersListParams {
  /** Start date (ISO string) */
  from?: string
  /** End date (ISO string) */
  to?: string
  /** Filter by supplier status */
  supplier_status?: SupplierStatus
  /** Filter by WB status */
  wb_status?: WbStatus
  /** Filter by nm_id */
  nm_id?: number
  /** Sort field */
  sort_by?: 'created_at' | 'status_updated_at' | 'price' | 'sale_price'
  /** Sort direction */
  sort_order?: 'asc' | 'desc'
  /** Items per page (1-1000, default 100) */
  limit?: number
  /** Pagination offset */
  offset?: number
}

// --- Error Types ---

/** Orders API error response */
export interface OrdersErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
}
