/**
 * Products - Types & Query Config
 * Extracted from useProducts.ts for file size compliance (Epic 74)
 */

export interface ProductFilters {
  /** Filter: true = with COGS, false = without COGS, undefined = all */
  has_cogs?: boolean
  /** Search by nm_id or sa_name (partial match) - sent as 'q' parameter to backend */
  search?: string
  /** Cursor for pagination (cursor-based, not page-based) */
  cursor?: string
  /** Items per page (default: 50, max: 200) */
  limit?: number
  /** Request #15: Include margin data in response */
  include_margin?: boolean
  /** Epic 24 / Story 24.7-fe: Include storage cost data */
  include_storage?: boolean
}

// ============================================================================
// Query Config Constants
// ============================================================================

/** Stale time when margin or storage data included (60s - more expensive queries) */
export const PRODUCTS_STALE_TIME_WITH_EXTRAS = 60000

/** Stale time without extras (30s) */
export const PRODUCTS_STALE_TIME_DEFAULT = 30000

/** GC time for product queries (5 minutes) */
export const PRODUCTS_GC_TIME = 300000

/** Stale time for product count query (1 minute) */
export const PRODUCTS_COUNT_STALE_TIME = 60000

/**
 * Build URL search params from product filters
 */
export function buildProductParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.has_cogs !== undefined) {
    params.append('has_cogs', String(filters.has_cogs))
  }
  if (filters.search) {
    params.append('q', filters.search)
  }
  if (filters.cursor) {
    params.append('cursor', filters.cursor)
  }
  if (filters.limit !== undefined) {
    params.append('limit', String(filters.limit))
  }
  if (filters.include_margin) {
    params.append('include_cogs', 'true')
  }
  if (filters.include_storage) {
    params.append('include_storage', 'true')
  }

  return params
}

/**
 * Get stale time based on filter options
 */
export function getProductsStaleTime(filters: ProductFilters): number {
  return filters.include_margin || filters.include_storage
    ? PRODUCTS_STALE_TIME_WITH_EXTRAS
    : PRODUCTS_STALE_TIME_DEFAULT
}
