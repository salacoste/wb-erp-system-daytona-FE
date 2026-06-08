/**
 * Storage Analytics Types
 * Story 24.1-FE: TypeScript Types & API Client
 * Epic 24: Paid Storage Analytics (Frontend)
 * Reference: docs/request-backend/36-epic-24-paid-storage-analytics-api.md
 */

// ============================================================================
// Period Types
// ============================================================================

/**
 * Storage analytics period info
 */
export interface StoragePeriod {
  /** ISO week start (e.g., "2025-W44") */
  from: string
  /** ISO week end (e.g., "2025-W47") */
  to: string
  /** Total days in the period */
  days_count: number
}

// ============================================================================
// Storage By SKU Types (GET /v1/analytics/storage/by-sku)
// ============================================================================

/**
 * Individual SKU storage data
 *
 * Request #156: Important distinction:
 * - storage_cost_total = historical charges for the period (product MAY not be on warehouse now)
 * - total_stock = current stock level (0 = no stock in WB warehouses)
 * - Products can have storage charges even if currently sold out (FBS products, sold items)
 */
export interface StorageBySkuItem {
  /** WB article number */
  nm_id: string
  /** Seller's vendor code */
  vendor_code: string | null
  /** Product name */
  product_name: string | null
  /** Brand name */
  brand: string | null
  /** Total storage cost for the period (₽) - HISTORICAL, not current stock indicator */
  storage_cost_total: number
  /** Average daily storage cost (₽/day) */
  storage_cost_avg_daily: number
  /** Average volume (liters, null if no data) */
  volume_avg: number | null
  /** List of warehouses where product is stored */
  warehouses: string[]
  /** Number of days stored in period */
  days_stored: number
  /** Current stock level in WB warehouses (null = data unavailable, 0 = no stock) */
  total_stock?: number | null
  /** Date of last storage charge (YYYY-MM-DD, null if no charges) */
  last_charge_date?: string | null
  /** True if product currently has stock in WB warehouses */
  has_warehouse_stock?: boolean
}

/**
 * Summary statistics for storage by SKU
 */
export interface StorageSummary {
  /** Total storage cost for all products (₽) */
  total_storage_cost: number
  /** Number of unique products */
  products_count: number
  /** Average cost per product (₽) */
  avg_cost_per_product: number
}

/**
 * Pagination info (cursor-based)
 */
export interface StoragePagination {
  /** Total number of items */
  total: number
  /** Cursor for next page (null if no more pages) */
  cursor: string | null
  /** True if more pages available */
  has_more: boolean
}

/**
 * Response from GET /v1/analytics/storage/by-sku
 */
export interface StorageBySkuResponse {
  period: StoragePeriod
  data: StorageBySkuItem[]
  summary: StorageSummary
  pagination: StoragePagination
  /** Flag indicating if data exists for the requested period */
  has_data: boolean
}

// ============================================================================
// Top Consumers Types (GET /v1/analytics/storage/top-consumers)
// ============================================================================

/**
 * Top consumer item with storage cost ranking
 *
 * Request #156: Note that storage_cost is HISTORICAL - product may not be on warehouse now.
 * Check has_warehouse_stock to distinguish between active storage vs past charges.
 */
export interface TopConsumerItem {
  /** Rank position (1-based) */
  rank: number
  /** WB article number */
  nm_id: string
  /** Seller's vendor code */
  vendor_code: string | null
  /** Product name */
  product_name: string | null
  /** Brand name */
  brand: string | null
  /** Storage cost for the period (₽) - HISTORICAL, not current stock indicator */
  storage_cost: number
  /** Percentage of total storage cost */
  percent_of_total: number
  /** Volume (liters, null if no data) */
  volume: number | null
  /** Net revenue (optional, if include_revenue=true) */
  revenue_net?: number
  /** Storage-to-revenue ratio % (optional, null if no revenue data) */
  storage_to_revenue_ratio?: number | null
  /** Current stock level in WB warehouses (null = data unavailable, 0 = no stock) */
  total_stock?: number | null
  /** Date of last storage charge (YYYY-MM-DD, null if no charges) */
  last_charge_date?: string | null
  /** True if product currently has stock in WB warehouses */
  has_warehouse_stock?: boolean
}

/**
 * Response from GET /v1/analytics/storage/top-consumers
 */
export interface TopConsumersResponse {
  period: StoragePeriod
  top_consumers: TopConsumerItem[]
  /** Total storage cost for all products (for percent calculation) */
  total_storage_cost: number
  /** Flag indicating if data exists for the requested period */
  has_data: boolean
}

// ============================================================================
// Re-exports from storage-analytics-trends.ts (backward compatibility)
// ============================================================================

export type {
  StorageTrendPoint,
  MetricSummary,
  StorageTrendsResponse,
  PaidStorageImportRequest,
  ImportStatus,
  PaidStorageImportResponse,
  ImportStatusResponse,
  StorageSummaryResponse,
  StorageSummaryParams,
  StorageTrendsParams,
} from './storage-analytics-trends'

// ============================================================================
// Query Parameter Types (kept here — depend on local types only)
// ============================================================================

/**
 * Parameters for GET /v1/analytics/storage/by-sku
 * Supports both week-based (weekStart/weekEnd) and date-based (dateFrom/dateTo) queries
 */
export interface StorageBySkuParams {
  /** Start week (ISO format, e.g., "2025-W44") */
  weekStart: string
  /** End week (ISO format, e.g., "2025-W47") */
  weekEnd: string
  /** Filter by nm_id */
  nm_id?: string
  /** Filter by brand (comma-separated for multiple) */
  brand?: string
  /** Filter by warehouse (comma-separated for multiple) */
  warehouse?: string
  /** Sort field */
  sort_by?: 'storage_cost' | 'volume' | 'days_stored'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
  /** Items per page (default: 20) */
  limit?: number
  /** Pagination cursor */
  cursor?: string
}

/**
 * Parameters for GET /v1/analytics/storage/top-consumers
 */
export interface StorageTopConsumersParams {
  /** Start week (ISO format) */
  weekStart: string
  /** End week (ISO format) */
  weekEnd: string
  /** Number of top consumers to return (default: 5) */
  limit?: number
  /** Include revenue data for ratio calculation */
  include_revenue?: boolean
  /** Filter by brand name(s) - comma-separated for multi-select (Story 24.9) */
  brand?: string
  /** Filter by warehouse name(s) - comma-separated for multi-select (Story 24.9) */
  warehouse?: string
}
