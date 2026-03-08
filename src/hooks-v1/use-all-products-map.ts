/** Shared hook: fetch ALL products via cursor pagination for name/brand enrichment */
'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ProductListResponse } from '@/types/cogs'

export interface ProductInfo {
  saName: string
  brand: string
  vendorCode: string
}

const MAX_ENRICHMENT_PAGES = 50 // Safety limit: supports up to 10,000 products

/**
 * Fetches all products using cursor-based pagination (no 200-cap)
 * and returns a Map<nmId, ProductInfo> for enrichment lookups.
 *
 * @param enabled - defer fetching until consumer data is ready
 */
export function useAllProductsMap(enabled = true) {
  const { data: allProducts } = useQuery({
    queryKey: ['products', 'all-for-enrichment'],
    queryFn: async () => {
      const products: { nm_id: number; sa_name: string; brand: string; vendor_code: string }[] = []
      let cursor: string | undefined
      let pages = 0
      do {
        const params = new URLSearchParams({ limit: '200' })
        if (cursor) params.append('cursor', cursor)
        const response = await apiClient.get<ProductListResponse>(
          `/v1/products?${params.toString()}`
        )
        for (const p of response.products) {
          products.push({
            nm_id: Number(p.nm_id),
            sa_name: p.sa_name ?? '',
            brand: p.brand ?? '',
            vendor_code: p.vendor_code ?? '',
          })
        }
        cursor = response.pagination.next_cursor
        pages++
      } while (cursor && pages < MAX_ENRICHMENT_PAGES)
      return products
    },
    enabled,
    staleTime: 120_000,
    gcTime: 300_000,
  })

  return useMemo(() => {
    const map = new Map<number, ProductInfo>()
    for (const p of allProducts ?? []) {
      map.set(p.nm_id, { saName: p.sa_name, brand: p.brand, vendorCode: p.vendor_code })
    }
    return map
  }, [allProducts])
}
