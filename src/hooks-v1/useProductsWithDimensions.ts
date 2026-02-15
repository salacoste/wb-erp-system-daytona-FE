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
 * - Case-insensitive client-side filtering
 * - Matches sa_name, vendor_code, nm_id, AND brand fields
 * - Supports partial matching (e.g., "вил" finds "Вилли")
 *
 * @example
 * const { data, isLoading } = useProductsWithDimensions('вилли')
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
    // Case-insensitive client-side filtering across ALL searchable fields
    // Including brand for cases like searching "Вилли" brand name
    select: (data) => ({
      ...data,
      products: data.products.filter((product) => {
        // Normalize all fields to lowercase for case-insensitive search
        const saName = product.sa_name?.toLowerCase() ?? ''
        const vendorCode = product.vendor_code?.toLowerCase() ?? ''
        const nmId = product.nm_id?.toLowerCase() ?? ''
        const brand = product.brand?.toLowerCase() ?? ''

        // Match against any field
        return (
          saName.includes(lowerSearch) ||
          vendorCode.includes(lowerSearch) ||
          nmId.includes(lowerSearch) ||
          brand.includes(lowerSearch)
        )
      }),
    }),
  })
}
