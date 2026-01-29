/**
 * TypeScript Types for Supplies Module
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Reference: docs/stories/epic-53/story-53.4-fe-supply-detail-page.md
 */

// =============================================================================
// Enums and Constants
// =============================================================================

/** Supply status values */
export type SupplyStatus = 'OPEN' | 'CLOSED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED'

/** Sticker format options */
export type StickerFormat = 'png' | 'svg' | 'zpl'

/** Document types available for supplies */
export type DocumentType = 'sticker' | 'barcode' | 'acceptance_act'

/** Sort field options for supplies list */
export type SuppliesSortField = 'created_at' | 'closed_at' | 'orders_count'

/** Sort order options */
export type SortOrder = 'asc' | 'desc'

// =============================================================================
// Core Interfaces
// =============================================================================

/** Order within a supply */
export interface SupplyOrder {
  /** Order ID from WB */
  orderId: string
  /** Unique order identifier */
  orderUid: string
  /** Product article (nm_id) */
  nmId: number
  /** Vendor code (SKU) */
  vendorCode: string
  /** Product name (can be null) */
  productName: string | null
  /** Sale price in rubles */
  salePrice: number
  /** Supplier status from WB */
  supplierStatus: string
  /** When order was added to supply */
  addedAt: string
}

/** Document attached to a supply */
export interface SupplyDocument {
  /** Document type */
  type: DocumentType
  /** File format */
  format: string
  /** When document was generated */
  generatedAt: string
  /** URL to download document */
  downloadUrl: string
  /** File size in bytes (null if unknown) */
  sizeBytes: number | null
}

/** Supply list item (minimal data for list display) */
export interface SupplyListItem {
  /** Internal supply ID */
  id: string
  /** WB supply ID (null for optimistic entries) */
  wbSupplyId: string | null
  /** Supply name (null if not set) */
  name: string | null
  /** Current status */
  status: SupplyStatus
  /** Number of orders in supply */
  ordersCount: number
  /** Total value of orders in rubles */
  totalValue: number
  /** Creation timestamp */
  createdAt: string
  /** Closure timestamp (null if not closed) */
  closedAt: string | null
  /** Last sync with WB timestamp */
  syncedAt: string | null
}

/** Full supply with orders and documents */
export interface Supply extends SupplyListItem {
  /** Target warehouse ID (null if not assigned) */
  warehouseId: number | null
  /** Target warehouse name (null if not assigned) */
  warehouseName: string | null
  /** Orders in this supply */
  orders: SupplyOrder[]
  /** Generated documents */
  documents: SupplyDocument[]
}

// =============================================================================
// API Response Types
// =============================================================================

/** Pagination info for list responses */
export interface SuppliesPagination {
  total: number
  limit: number
  offset: number
}

/** Filters applied to list response */
export interface SuppliesFilters {
  status: SupplyStatus | null
  from: string | null
  to: string | null
}

/** Supplies list response */
export interface SuppliesListResponse {
  items: SupplyListItem[]
  pagination: SuppliesPagination
  filters: SuppliesFilters
}

/** Rate limit info for sync operations */
export interface SyncRateLimit {
  remaining: number
  resetAt: string
}

/** Supply detail response (extends Supply) */
export interface SupplyDetailResponse extends Supply {
  syncRateLimit?: SyncRateLimit
}

// =============================================================================
// API Request Types
// =============================================================================

/** Parameters for listing supplies */
export interface SuppliesListParams {
  status?: SupplyStatus
  from?: string
  to?: string
  sort_by?: SuppliesSortField
  sort_order?: SortOrder
  limit?: number
  offset?: number
}

/** Request to create a new supply */
export interface CreateSupplyRequest {
  name?: string
}

/** Response from creating a supply */
export interface CreateSupplyResponse extends SupplyListItem {}

/** Request to add orders to a supply */
export interface AddOrdersRequest {
  orderIds: string[]
}

/** Failure info for add orders */
export interface AddOrderFailure {
  orderId: string
  reason: string
}

/** Response from adding orders */
export interface AddOrdersResponse {
  addedCount: number
  failures: AddOrderFailure[]
  totalOrdersCount: number
}

/** Request to remove orders from a supply */
export interface RemoveOrdersRequest {
  orderIds: string[]
}

/** Response from removing orders */
export interface RemoveOrdersResponse {
  removedCount: number
  totalOrdersCount: number
}

/** Response from closing a supply */
export interface CloseSupplyResponse {
  status: SupplyStatus
  closedAt: string
  message: string
}

/** Request to generate stickers */
export interface GenerateStickersRequest {
  format: StickerFormat
}

/** Response from generating stickers */
export interface GenerateStickersResponse {
  document: SupplyDocument
  data?: string
  message: string
}

/** Status change info from sync */
export interface SupplyStatusChange {
  supplyId: string
  oldStatus: SupplyStatus
  newStatus: SupplyStatus
}

/** Sync error info */
export interface SyncError {
  supplyId: string
  error: string
}

/** Response from syncing supplies */
export interface SyncSuppliesResponse {
  syncedCount: number
  statusChanges: SupplyStatusChange[]
  errors: SyncError[]
  nextSyncAt: string
}

// =============================================================================
// Error Response Types
// =============================================================================

/** Error response structure */
export interface SuppliesErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
}

// =============================================================================
// UI Configuration Types
// =============================================================================

/** Status configuration for UI display */
export interface SupplyStatusConfig {
  label: string
  color: string
  bgColor: string
  icon: string
}

/** Status configuration map with Russian labels */
export const SUPPLY_STATUS_CONFIG: Record<SupplyStatus, SupplyStatusConfig> = {
  OPEN: {
    label: 'Открыта',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: 'PackageOpen',
  },
  CLOSED: {
    label: 'Закрыта',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: 'PackageCheck',
  },
  DELIVERING: {
    label: 'В пути',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: 'Truck',
  },
  DELIVERED: {
    label: 'Доставлена',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: 'CheckCircle',
  },
  CANCELLED: {
    label: 'Отменена',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: 'XCircle',
  },
}

// =============================================================================
// Helper Functions
// =============================================================================

/** Get status configuration for a given status */
export function getSupplyStatusConfig(status: SupplyStatus): SupplyStatusConfig {
  return SUPPLY_STATUS_CONFIG[status] ?? SUPPLY_STATUS_CONFIG.OPEN
}

/** Get status label in Russian */
export function getSupplyStatusLabel(status: SupplyStatus): string {
  return getSupplyStatusConfig(status).label
}

/** Check if supply is in final state (DELIVERED or CANCELLED) */
export function isSupplyFinal(status: SupplyStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED'
}

/** Check if supply can be modified (add/remove orders) - only OPEN */
export function canModifySupply(status: SupplyStatus): boolean {
  return status === 'OPEN'
}

/** Check if supply can generate stickers - only CLOSED */
export function canGenerateStickers(status: SupplyStatus): boolean {
  return status === 'CLOSED'
}
