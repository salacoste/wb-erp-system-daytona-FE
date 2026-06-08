/**
 * Supplies Core Types — enums, interfaces, API types
 * Split from supplies.ts for file size compliance
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
  /** Total value of orders in rubles. OPTIONAL — the backend list/detail endpoints do NOT compute
   *  this (select returns totalItems, not value); rendered as "—" until backend provides it
   *  (iter-68, request #194). */
  totalValue?: number
  /** Creation timestamp */
  createdAt: string
  /** Closure timestamp (null if not closed) */
  closedAt: string | null
  /** Last sync with WB timestamp */
  syncedAt: string | null
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

/** Request to create a new supply */
export interface CreateSupplyRequest {
  name?: string
}

/** Response from creating a supply */
export interface CreateSupplyResponse extends SupplyListItem {}

/**
 * Response from triggering supply sync — matches backend TriggerSyncResponseDto.
 * POST /v1/supplies/sync is ASYNC (HTTP 202, fire-and-forget): it only enqueues a job.
 */
export interface SyncSuppliesResponse {
  jobId: string
  message: string
}

/** Parameters for listing supplies */
export interface SuppliesListParams {
  status?: SupplyStatus
  from?: string
  to?: string
  limit?: number
  offset?: number
}

/** Error response structure */
export interface SuppliesErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
}
