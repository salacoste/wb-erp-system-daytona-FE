/**
 * Search Analytics React Query Hooks
 * Epic 71-FE: Search Analytics & Jam Gating
 */

import { useQuery } from '@tanstack/react-query'
import {
  getSearchByProduct,
  getSearchByQuery,
  getSearchOrders,
  searchQueryKeys,
  SEARCH_CACHE,
} from '@/lib/api/search-analytics'
import type { SearchOrdersParams } from '@/types/search-analytics'

/** Queries driving traffic to a specific product (nmId) */
export function useSearchByProduct(nmId: number | undefined, from: string, to: string) {
  const enabled = !!nmId && !!from && !!to
  const params = { nmId: nmId ?? 0, from, to }
  return useQuery({
    queryKey: searchQueryKeys.byProduct(params),
    queryFn: () => getSearchByProduct({ nmId: nmId!, from, to }),
    enabled,
    staleTime: SEARCH_CACHE.staleTime,
    gcTime: SEARCH_CACHE.gcTime,
    retry: 1,
  })
}

/** Products ranking for a search term (min 2 chars) */
export function useSearchByQuery(query: string, from: string, to: string) {
  const params = { query, from, to }
  return useQuery({
    queryKey: searchQueryKeys.byQuery(params),
    queryFn: () => getSearchByQuery(params),
    enabled: query.length >= 2 && !!from && !!to,
    staleTime: SEARCH_CACHE.staleTime,
    gcTime: SEARCH_CACHE.gcTime,
    retry: 1,
  })
}

/** Order attribution from organic search */
export function useSearchOrders(from: string, to: string, params?: Partial<SearchOrdersParams>) {
  const fullParams: SearchOrdersParams = { from, to, ...params }
  return useQuery({
    queryKey: searchQueryKeys.orders(fullParams),
    queryFn: () => getSearchOrders(fullParams),
    enabled: !!from && !!to,
    staleTime: SEARCH_CACHE.staleTime,
    gcTime: SEARCH_CACHE.gcTime,
    retry: 1,
  })
}
