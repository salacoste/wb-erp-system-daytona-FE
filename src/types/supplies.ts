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
 * Real status changes arrive later via polling/cache invalidation, NOT in this response.
 */
export interface SyncSuppliesResponse {
  jobId: string
  message: string
}

// =============================================================================
// API Request Types
// =============================================================================

/** Parameters for listing supplies */
export interface SuppliesListParams {
  status?: SupplyStatus
  from?: string
  to?: string
  limit?: number
  offset?: number
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
// Re-exports from supply-orders.ts (backward compatibility)
// =============================================================================

export type {
  SupplyOrder,
  SupplyDocument,
  Supply,
  SupplyDetailResponse,
  AddOrdersRequest,
  AddOrdersResponse,
  RemoveOrdersRequest,
  RemoveOrdersResponse,
  CloseSupplyResponse,
  GenerateStickersRequest,
  GenerateStickersResponse,
  SupplyStatusChange,
} from './supply-orders'

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

/**
 * Neutral fallback for an unrecognized/out-of-enum status (status-honesty): an unknown
 * lifecycle state must not masquerade as the blue "Открыта" (OPEN, implies editable).
 */
const SUPPLY_STATUS_FALLBACK_CONFIG: SupplyStatusConfig = {
  label: 'Неизвестно',
  color: 'text-gray-600',
  bgColor: 'bg-gray-50',
  icon: 'HelpCircle',
}

/** Get status configuration for a given status */
export function getSupplyStatusConfig(status: SupplyStatus): SupplyStatusConfig {
  return SUPPLY_STATUS_CONFIG[status] ?? SUPPLY_STATUS_FALLBACK_CONFIG
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
