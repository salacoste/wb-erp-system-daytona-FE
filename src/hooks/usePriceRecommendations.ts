'use client'

/**
 * TanStack Query hooks for Price Recommendations
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 * Story 122.2-FE: history hook
 * Story W3-FE (cabinet-isolation discipline, Story 97.5-FE): every concrete
 * queryKey embeds cabinetId from the auth store, so switching cabinets can
 * never serve another cabinet's cached rows (isolation beyond the
 * X-Cabinet-Id header sent by apiClient). `all` is unchanged —
 * invalidateQueries({ queryKey: queryKeys.all }) in usePriceRefresh /
 * usePricingBasis keeps prefix-invalidating everything.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import {
  getPriceRecommendations,
  getPriceRecommendation,
  refreshPriceRecommendations,
  getPriceRecommendationHistory,
} from '@/lib/api/price-recommendations'
import type { PriceRecommendationsParams } from '@/types/price-recommendations'

const queryKeys = {
  all: ['price-recommendations'] as const,
  lists: () => ['price-recommendations', 'list'] as const,
  list: (cabinetId: string, params: PriceRecommendationsParams) =>
    ['price-recommendations', 'list', cabinetId, params] as const,
  details: () => ['price-recommendations', 'detail'] as const,
  detail: (cabinetId: string, nmId: number) =>
    ['price-recommendations', 'detail', cabinetId, nmId] as const,
  histories: () => ['price-recommendations', 'history'] as const,
  history: (cabinetId: string, nmId: number, limit?: number) =>
    ['price-recommendations', 'history', cabinetId, nmId, limit] as const,
}

/** Hook: fetch price recommendations list with filters (cabinet-scoped cache) */
export function usePriceRecommendations(
  params: PriceRecommendationsParams = {},
  options: { enabled?: boolean } = {}
) {
  const cabinetId = useAuthStore(auth => auth.cabinetId)

  return useQuery({
    queryKey: queryKeys.list(cabinetId ?? '', params),
    queryFn: () => getPriceRecommendations(params),
    enabled: (options.enabled ?? true) && cabinetId != null,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

/** Hook: fetch a single SKU recommendation (cabinet-scoped cache) */
export function usePriceRecommendation(nmId: number | null) {
  const cabinetId = useAuthStore(auth => auth.cabinetId)

  return useQuery({
    queryKey: queryKeys.detail(cabinetId ?? '', nmId ?? 0),
    // Anti-pattern #2 compliance: explicit guard in queryFn, no non-null assertion
    queryFn: () => {
      if (nmId === null) throw new Error('nmId is required')
      return getPriceRecommendation(nmId)
    },
    enabled: nmId !== null && cabinetId != null,
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

/** Hook: fetch weekly price recommendation history for a single SKU (Story 122.2, cabinet-scoped) */
export function usePriceRecommendationHistory(nmId: number | null, limit?: number) {
  const cabinetId = useAuthStore(auth => auth.cabinetId)

  return useQuery({
    queryKey: queryKeys.history(cabinetId ?? '', nmId ?? 0, limit),
    // Anti-pattern #2 compliance: explicit guard in queryFn, no non-null assertion
    queryFn: () => {
      if (nmId === null) throw new Error('nmId is required')
      return getPriceRecommendationHistory(nmId, { limit })
    },
    enabled: nmId !== null && cabinetId != null,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export { queryKeys as priceRecommendationQueryKeys }
