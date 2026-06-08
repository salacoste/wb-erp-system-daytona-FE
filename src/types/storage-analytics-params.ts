/**
 * Storage Analytics Types — Query parameter interfaces
 * Split from storage-analytics.ts for 200-line ESLint cap compliance.
 */

// ============================================================================
// Query Parameter Types
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
