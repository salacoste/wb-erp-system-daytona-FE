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

/**
 * WB-side order status (Статус WB).
 * Validation F-11: ready_for_pickup (~11% of live orders) + declined_by_client
 * (~2%) were absent → rendered as raw machine codes + un-filterable.
 */
export type WbStatus =
  | 'waiting'
  | 'sorted'
  | 'sold'
  | 'ready_for_pickup'
  | 'canceled'
  | 'canceled_by_client'
  | 'declined_by_client'
  | 'defect'
  | 'return_at_pvz'
  | 'returned_to_seller'

// --- Operational Status (Epic Moysklad, Story O1) ---

/**
 * Order operational status (operational pipeline).
 * Story O1: seller-managed lifecycle distinct from WB/native statuses.
 * PATCH /v1/orders/:uuid/operational-status drives transitions.
 */
export type OrderOperationalStatus =
  'NEW' | 'ASSEMBLED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'

/** Russian labels for operational statuses */
export const ORDER_OPERATIONAL_STATUS_LABELS: Record<OrderOperationalStatus, string> = {
  NEW: 'Новый',
  ASSEMBLED: 'Собран',
  PACKED: 'Упакован',
  SHIPPED: 'Отгружен',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
  RETURNED: 'Возврат',
}

/**
 * Operational status state machine (verified against backend 2026-07-04).
 * Keys = current status; values = statuses the operator MAY transition to.
 * Backend enforces the same; FE shows only these as dropdown options.
 */
export const ALLOWED_TRANSITIONS: Record<OrderOperationalStatus, OrderOperationalStatus[]> = {
  NEW: ['ASSEMBLED', 'CANCELLED'],
  ASSEMBLED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
}

/** Terminal operational statuses — no further transitions (badge only, no dropdown). */
export const TERMINAL_STATUSES: Set<OrderOperationalStatus> = new Set([
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
])

/** Response from PATCH /v1/orders/:uuid/operational-status */
export interface UpdateOrderOperationalStatusResponse {
  id: string
  operationalStatus: OrderOperationalStatus
  operationalStatusUpdatedAt: string | null
}

// --- Order Item Types ---

/** Order item in list view (GET /v1/orders) */
export interface OrderFbsItem {
  /**
   * OrderFbs UUID — primary key for ALL mutations (Story O1).
   * NOT the WB `orderId` (a number string); use this for PATCH/operational-status.
   * AP#10: opaque UUID rendered via String().
   */
  id: string
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
  /** Operational status (Story O1) — defaults to NEW */
  operationalStatus: OrderOperationalStatus
  /** Last operational-status change timestamp — null until first transition (AP#8: render «—») */
  operationalStatusUpdatedAt: string | null
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

export type ExpirationRequirement = 'required' | 'optional'

/** Backend-authoritative WB expiration metadata capability. */
export interface ExpirationMeta {
  requirement: ExpirationRequirement
  value: string | null
  decision: string
  /** At least one write workflow is available; prefer the specific capability flags below. */
  editable: boolean
  manualEditable: boolean
  fefoAvailable: boolean
  /** A previous WB write has no definitive read-back and must be reconciled before another PUT. */
  reconciliationRequired: boolean
  minimumDate: string
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
  /** WB expiration capability; null means the metadata must not be sent. */
  expirationMeta: ExpirationMeta | null
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
