/**
 * Hook for fetching product list with COGS data
 * Story 4.1: Single Product COGS Assignment Interface
 * Epic 18 Backend API Integration
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ProductListResponse, ProductWithCogs } from '@/types/api'
import {
  type ProductFilters,
  PRODUCTS_GC_TIME,
  PRODUCTS_COUNT_STALE_TIME,
  buildProductParams,
  getProductsStaleTime,
} from './useProducts-utils'

// Re-export types for consumers
export type { ProductFilters } from './useProducts-utils'

/**
 * Hook to fetch product list with optional filters
 */
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async (): Promise<ProductListResponse> => {
      try {
        const params = buildProductParams(filters)
        console.info('[Products] Fetching product list with filters:', filters)

        const response = await apiClient.get<ProductListResponse>(
          `/v1/products?${params.toString()}`
        )

        console.info('[Products] Received:', {
          count: response.products?.length || 0,
          pagination: response.pagination,
        })

        return response
      } catch (error) {
        console.error('[Products] Failed to fetch product list:', error)
        throw error
      }
    },
    staleTime: getProductsStaleTime(filters),
    gcTime: PRODUCTS_GC_TIME,
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: true,
    placeholderData: undefined,
  })
}

/**
 * Hook to fetch single product details with COGS and margin data
 */
export function useProductDetail(nmId: string | undefined) {
  return useQuery({
    queryKey: ['products', nmId],
    queryFn: async () => {
      if (!nmId) throw new Error('Product ID is required')
      try {
        console.info(`[Products] Fetching product details for nm_id: ${nmId}`)
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
    staleTime: 30000,
    gcTime: PRODUCTS_GC_TIME,
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: !!nmId,
  })
}

/** Hook to fetch products without COGS (for COGS assignment UI) */
export function useProductsWithoutCogs(filters: Omit<ProductFilters, 'has_cogs'> = {}) {
  return useProducts({ ...filters, has_cogs: false })
}

/** Hook to fetch products with COGS (for viewing assigned COGS) */
export function useProductsWithCogs(filters: Omit<ProductFilters, 'has_cogs'> = {}) {
  return useProducts({ ...filters, has_cogs: true })
}

/** Hook to fetch total product count */
export function useProductsCount() {
  return useQuery({
    queryKey: ['products', 'count'],
    queryFn: async (): Promise<number> => {
      try {
        console.info('[Products] Fetching product count')
        const response = await apiClient.get<ProductListResponse>('/v1/products?limit=1')
        const count = response.pagination?.total || 0
        console.info('[Products] Total product count:', count)
        return count
      } catch (error) {
        console.error('[Products] Failed to fetch product count:', error)
        throw error
      }
    },
    staleTime: PRODUCTS_COUNT_STALE_TIME,
    gcTime: PRODUCTS_GC_TIME,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
