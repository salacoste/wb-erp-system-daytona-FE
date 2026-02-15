/**
 * Hook for fetching product list with COGS data
 * Story 4.1: Single Product COGS Assignment Interface
 * Epic 18 Backend API Integration
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ProductListResponse, ProductWithCogs } from '@/types/api'

export interface ProductFilters {
  has_cogs?: boolean       // Filter: true = with COGS, false = without COGS, undefined = all
  search?: string          // Search by nm_id or sa_name (partial match) - sent as 'q' parameter to backend
  cursor?: string          // Cursor for pagination (cursor-based, not page-based)
  limit?: number           // Items per page (default: 50, max: 200)
  include_margin?: boolean // Request #15: Include margin data in response (slower ~300ms, requires backend Request #15 implementation)
  include_storage?: boolean // Epic 24 / Story 24.7-fe: Include storage cost data (storage_cost_daily_avg, storage_cost_weekly, storage_period)
}

/**
 * Hook to fetch product list with optional filters
 *
 * @example
 * // Products without COGS (for COGS assignment UI)
 * const { data, isLoading } = useProducts({ has_cogs: false });
 *
 * @example
 * // Search products with cursor-based pagination
 * const { data, isLoading } = useProducts({ search: 'Nike', limit: 50 });
 *
 * @example
 * // All products with COGS
 * const { data, isLoading } = useProducts({ has_cogs: true });
 */
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters], // Include cursor in cache key for pagination
    queryFn: async (): Promise<ProductListResponse> => {
      try {
        // Build query parameters (backend uses snake_case and cursor-based pagination)
        const params = new URLSearchParams()

        if (filters.has_cogs !== undefined) {
          params.append('has_cogs', String(filters.has_cogs))
        }

        if (filters.search) {
          // Backend expects 'q' parameter for search (see QueryProductsDto line 72)
          params.append('q', filters.search)
        }

        if (filters.cursor) {
          params.append('cursor', filters.cursor)
        }

        if (filters.limit !== undefined) {
          params.append('limit', String(filters.limit))
        }

        // Request #15: Include margin data if requested
        if (filters.include_margin) {
          params.append('include_cogs', 'true')
        }

        // Epic 24 / Story 24.7-fe: Include storage cost data if requested
        // Returns: storage_cost_daily_avg, storage_cost_weekly, storage_period
        // Reference: docs/request-backend/36-epic-24-paid-storage-analytics-api.md
        if (filters.include_storage) {
          params.append('include_storage', 'true')
        }

        console.info('[Products] Fetching product list with filters:', filters)

        // Call backend API
        const response = await apiClient.get<ProductListResponse>(
          `/v1/products?${params.toString()}`
        )

        console.group('🔍 [Products Hook DEBUG] Query Result')
        console.log('Query key:', ['products', filters])
        console.log('Received products:', {
          count: response.products?.length || 0,
          pagination: response.pagination,
        })
        
        // Debug: Log margin data for all products if include_margin is enabled
        if (filters.include_margin && response.products && response.products.length > 0) {
          console.log('Products with margin data:')
          response.products.forEach((product, index) => {
            console.log(`  [${index}] ${product.nm_id}:`, {
              has_cogs: product.has_cogs,
              current_margin_pct: product.current_margin_pct,
              current_margin_pct_type: typeof product.current_margin_pct,
              missing_data_reason: product.missing_data_reason,
              cogs_valid_from: product.cogs?.valid_from,
          })
          })
        }
        console.groupEnd()

        return response
      } catch (error) {
        console.error('[Products] Failed to fetch product list:', error)
        throw error
      }
    },
    // Request #15 / Epic 24: Longer stale time when margin or storage data included (more expensive queries)
    staleTime: (filters.include_margin || filters.include_storage) ? 60000 : 30000,  // 60s with margin/storage, 30s without
    gcTime: 300000,    // 5 minutes
    refetchOnWindowFocus: true, // Refresh when window regains focus
    retry: 1,          // Retry once on error
    // Enable query only if we have valid filters
    enabled: true,
    // CRITICAL: Don't keep previous data during pagination to avoid showing duplicates
    placeholderData: undefined,
  })
}

/**
 * Hook to fetch single product details with COGS and margin data
 *
 * @example
 * const { data: product, isLoading } = useProductDetail('12345678');
 *
 * @returns Product with 9 enhanced fields from Epic 18:
 * - barcode
 * - current_margin_pct (from Epic 17 analytics)
 * - current_margin_period
 * - current_margin_sales_qty
 * - current_margin_revenue
 * - missing_data_reason ('no_sales_last_week' | 'no_sales_last_4_weeks' | 'no_cogs' | null)
 * - last_sale_date
 * - total_sales_qty
 */
export function useProductDetail(nmId: string | undefined) {
  return useQuery({
    queryKey: ['products', nmId],
    queryFn: async () => {
      if (!nmId) {
        throw new Error('Product ID is required')
      }

      try {
        console.info(`[Products] Fetching product details for nm_id: ${nmId}`)

        // Call backend API - returns ProductWithCogs with 9 new fields
        const response = await apiClient.get<ProductWithCogs>(`/v1/products/${nmId}`)

        console.info('[Products] Product details received:', {
          nm_id: response.nm_id,
          has_cogs: response.has_cogs,
          current_margin_pct: response.current_margin_pct,
          missing_data_reason: response.missing_data_reason,
        })

        return response
      } catch (error) {
        console.error(`[Products] Failed to fetch product ${nmId}:`, error)
        throw error
      }
    },
    staleTime: 30000,  // 30 seconds
    gcTime: 300000,    // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    // Enable query only if nmId is provided
    enabled: !!nmId,
  })
}

/**
 * Hook to fetch products without COGS (for COGS assignment UI)
 * Convenience wrapper around useProducts
 *
 * @example
 * const { data, isLoading } = useProductsWithoutCogs({ search: 'Nike', limit: 50 });
 */
export function useProductsWithoutCogs(filters: Omit<ProductFilters, 'has_cogs'> = {}) {
  return useProducts({ ...filters, has_cogs: false })
}

/**
 * Hook to fetch products with COGS (for viewing assigned COGS)
 * Convenience wrapper around useProducts
 *
 * @example
 * const { data, isLoading } = useProductsWithCogs({ search: 'Adidas', limit: 50 });
 */
export function useProductsWithCogs(filters: Omit<ProductFilters, 'has_cogs'> = {}) {
  return useProducts({ ...filters, has_cogs: true })
}

/**
 * Hook to fetch total product count
 * Used for dashboard metrics and onboarding summary
 *
 * @example
 * const { data: count, isLoading } = useProductsCount();
 */
export function useProductsCount() {
  return useQuery({
    queryKey: ['products', 'count'],
    queryFn: async (): Promise<number> => {
      try {
        console.info('[Products] Fetching product count')

        // Fetch first page with limit=1 to get total count from pagination
        // Note: Backend uses cursor-based pagination, no page parameter needed for first page
        const response = await apiClient.get<ProductListResponse>(
          '/v1/products?limit=1'
        )

        const count = response.pagination?.total || 0

        console.info('[Products] Total product count:', count)

        return count
      } catch (error) {
        console.error('[Products] Failed to fetch product count:', error)
        throw error
      }
    },
    staleTime: 60000,  // 1 minute - count doesn't change frequently
    gcTime: 300000,    // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
