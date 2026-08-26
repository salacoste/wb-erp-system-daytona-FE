/**
 * Batch search-position enrichment for the buyout table.
 *
 * For each SKU on the current buyout page, fetches search-by-product data
 * in parallel via useQueries and returns a Map<nmId, bestAvgPosition>.
 *
 * Why not N+1: TanStack Query caches each nmId independently (staleTime 4 min,
 * gcTime 30 min), so re-renders and page navigation reuse cached data.
 * Parallel fetching with useQueries avoids waterfall latency.
 *
 * Follows the useAllProductsMap enrichment pattern (Epic 69).
 */

'use client'

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getSearchByProduct } from '@/lib/api/search-analytics'
import { searchQueryKeys, SEARCH_CACHE } from '@/lib/api/search-analytics'

interface PositionEntry {
  bestAvgPosition: number | null
  totalQueries: number
}

/**
 * Returns a Map<nmId, { bestAvgPosition, totalQueries }> for the given nmIds.
 * Each entry contains the best (lowest) average search position across all
 * queries for that product, or null if no data available.
 */
export function useSearchPositionsMap(nmIds: number[], from: string, to: string, enabled: boolean) {
  const queries = useQueries({
    queries: nmIds.map(nmId => ({
      queryKey: searchQueryKeys.byProduct({ nmId, from, to }),
      queryFn: () => getSearchByProduct({ nmId, from, to }),
      enabled: enabled && nmId > 0 && !!from && !!to,
      staleTime: SEARCH_CACHE.staleTime,
      gcTime: SEARCH_CACHE.gcTime,
      retry: 1,
    })),
  })

  return useMemo(() => {
    const map = new Map<number, PositionEntry>()
    nmIds.forEach((nmId, i) => {
      const result = queries[i].data
      if (!result?.queries?.length) {
        map.set(nmId, { bestAvgPosition: null, totalQueries: 0 })
        return
      }
      // Best position = lowest avgPosition (position 1 is top)
      let best: number | null = null
      for (const q of result.queries) {
        if (q.avgPosition != null && q.avgPosition > 0 && (best === null || q.avgPosition < best)) {
          best = q.avgPosition
        }
      }
      map.set(nmId, { bestAvgPosition: best, totalQueries: result.totalQueries })
    })
    return map
  }, [nmIds, queries])
}
