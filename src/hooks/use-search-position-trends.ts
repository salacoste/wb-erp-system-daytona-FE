/**
 * Search Position Trends React Query Hooks
 * Backend: commit 3f29d8ca (2026-06-07)
 */

import { useQuery } from '@tanstack/react-query'
import {
  getPositionTrends,
  getPositionMovers,
  getPageOneOpportunities,
  getPositionHistory,
  searchPositionKeys,
  SEARCH_POSITION_CACHE,
} from '@/lib/api/search-position-trends'
import type {
  PositionTrendsParams,
  PositionMoversParams,
  PositionHistoryParams,
} from '@/types/search-position-trends'

/** Week-over-week position movers + page-one candidates */
export function usePositionTrends(params?: PositionTrendsParams) {
  return useQuery({
    queryKey: searchPositionKeys.trends(params ?? {}),
    queryFn: () => getPositionTrends(params),
    staleTime: SEARCH_POSITION_CACHE.staleTime,
    gcTime: SEARCH_POSITION_CACHE.gcTime,
    retry: 1,
  })
}

/** Rolling N-day period position movers with product enrichment */
export function usePositionMovers(params?: PositionMoversParams) {
  return useQuery({
    queryKey: searchPositionKeys.movers(params ?? {}),
    queryFn: () => getPositionMovers(params),
    staleTime: SEARCH_POSITION_CACHE.staleTime,
    gcTime: SEARCH_POSITION_CACHE.gcTime,
    retry: 1,
  })
}

/** SKUs close to page 1 in search results */
export function usePageOneOpportunities() {
  return useQuery({
    queryKey: searchPositionKeys.pageOneOpportunities(),
    queryFn: () => getPageOneOpportunities(),
    staleTime: SEARCH_POSITION_CACHE.staleTime,
    gcTime: SEARCH_POSITION_CACHE.gcTime,
    retry: 1,
  })
}

/** Daily position history for a single product */
export function usePositionHistory(nmId: number | undefined, params?: PositionHistoryParams) {
  return useQuery({
    queryKey: searchPositionKeys.positionHistory(nmId ?? 0, params ?? {}),
    queryFn: () => getPositionHistory(nmId!, params),
    enabled: !!nmId,
    staleTime: SEARCH_POSITION_CACHE.staleTime,
    gcTime: SEARCH_POSITION_CACHE.gcTime,
    retry: 1,
  })
}
