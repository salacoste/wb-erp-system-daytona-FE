'use client'

/**
 * TanStack Query hooks for Price Recommendations
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPriceRecommendations,
  getPriceRecommendation,
  refreshPriceRecommendations,
} from '@/lib/api/price-recommendations'
import type { PriceRecommendationsParams } from '@/types/price-recommendations'

const queryKeys = {
  all: ['price-recommendations'] as const,
  list: (params: PriceRecommendationsParams) => ['price-recommendations', 'list', params] as const,
  detail: (nmId: number) => ['price-recommendations', 'detail', nmId] as const,
}

/** Hook: fetch price recommendations list with filters */
export function usePriceRecommendations(
  params: PriceRecommendationsParams = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.list(params),
    queryFn: () => getPriceRecommendations(params),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

/** Hook: fetch a single SKU recommendation */
export function usePriceRecommendation(nmId: number | null) {
  return useQuery({
    queryKey: queryKeys.detail(nmId ?? 0),
    queryFn: () => getPriceRecommendation(nmId!),
    enabled: nmId !== null,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

/** Hook: trigger price recomputation */
export function usePriceRefresh() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: refreshPriceRecommendations,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
  })
}

export { queryKeys as priceRecommendationQueryKeys }
