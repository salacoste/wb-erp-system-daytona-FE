/**
 * Hook for fetching product list with COGS data
 * Story 4.1: Single Product COGS Assignment Interface
 * Epic 18 Backend API Integration
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { ApiError } from '@/types/api'
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
        return await apiClient.get<ProductListResponse>(`/v1/products?${params.toString()}`)
      } catch (err) {
        if (err instanceof ApiError && err.isWbTokenError) {
          // Note: Pagination uses snake_case (`total_pages`), per src/types/cogs.ts
          return { products: [], pagination: { total: 0, page: 1, limit: 20, total_pages: 0 } }
        }
        throw err
      }
    },
    staleTime: getProductsStaleTime(filters),
    gcTime: PRODUCTS_GC_TIME,
    refetchOnWindowFocus: true,
    retry: (count, err) => {
      if (err instanceof ApiError && err.isWbTokenError) return false
      return count < 1
    },
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
        return await apiClient.get<ProductWithCogs>(`/v1/products/${nmId}`)
      } catch (err) {
        if (err instanceof ApiError && err.isWbTokenError)
          return undefined as unknown as ProductWithCogs
        throw err
      }
    },
    staleTime: 30000,
    gcTime: PRODUCTS_GC_TIME,
    refetchOnWindowFocus: true,
    retry: (count, err) => {
      if (err instanceof ApiError && err.isWbTokenError) return false
      return count < 1
    },
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
        const response = await apiClient.get<ProductListResponse>('/v1/products?limit=1')
        return response.pagination?.total || 0
      } catch (err) {
        if (err instanceof ApiError && err.isWbTokenError) return 0
        throw err
      }
    },
    staleTime: PRODUCTS_COUNT_STALE_TIME,
    gcTime: PRODUCTS_GC_TIME,
    refetchOnWindowFocus: true,
    retry: (count, err) => {
      if (err instanceof ApiError && err.isWbTokenError) return false
      return count < 1
    },
  })
}
