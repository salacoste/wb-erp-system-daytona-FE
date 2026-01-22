/**
 * Hook for fetching products with dimensions
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Backend: Epic 45 - Products Dimensions & Category API
 */

import { useQuery } from '@tanstack/react-query'
import { getProductsWithDimensions } from '@/lib/api/products'

const SEARCH_MIN_LENGTH = 2
const DEFAULT_LIMIT = 50
const STALE_TIME = 60 * 1000 // 1 minute (cached by backend for 24h)

export const productsWithDimensionsKeys = {
  all: ['products-with-dimensions'] as const,
  search: (query: string) =>
    [...productsWithDimensionsKeys.all, 'search', query] as const,
}

/**
 * Hook to search products with dimensions for Price Calculator
 *
 * @param search - Search query (min 2 chars to trigger API call)
 * @returns Query result with products containing dimensions and category
 *
 * Features:
 * - Case-insensitive client-side filtering (Bug fix: search "шпатлевка" finds "Шпатлевка")
 * - Matches sa_name and vendor_code fields
 *
 * @example
 * const { data, isLoading } = useProductsWithDimensions('платье')
 */
export function useProductsWithDimensions(search: string) {
  const trimmedSearch = search.trim()
  const lowerSearch = trimmedSearch.toLowerCase()
  const shouldSearch = trimmedSearch.length >= SEARCH_MIN_LENGTH

  return useQuery({
    queryKey: productsWithDimensionsKeys.search(trimmedSearch),
    queryFn: () =>
      getProductsWithDimensions({
        q: trimmedSearch,
        limit: DEFAULT_LIMIT,
      }),
    enabled: shouldSearch,
    staleTime: STALE_TIME,
    // Show previous data while loading new results
    placeholderData: (previousData) => previousData,
    // Bug fix: Apply case-insensitive client-side filtering
    // Backend search may return broader results, we filter to exact (case-insensitive) matches
    select: (data) => ({
      ...data,
      products: data.products.filter(
        (product) =>
          product.sa_name?.toLowerCase().includes(lowerSearch) ||
          product.vendor_code?.toLowerCase().includes(lowerSearch) ||
          product.nm_id?.toLowerCase().includes(lowerSearch)
      ),
    }),
  })
}
