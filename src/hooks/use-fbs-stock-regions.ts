'use client'

/**
 * useFbsStockRegions — Epic 96-FE Story 96.11-FE
 *
 * TanStack Query hook for GET /v1/analytics/fbs/stock/regions
 * Returns warehouse region breakdown (latest-snapshot semantics — no date params).
 *
 * Cache policy: 30 min stale / 60 min gc / retry 1 / NO refetchInterval.
 *
 * CLAUDE.md anti-pattern #2 compliance: explicit guard in queryFn, no cabinetId!.
 * CLAUDE.md anti-pattern #5 compliance: selector named `authState`.
 *
 * @see src/lib/api/fbs-stock.ts
 * @see src/types/fbs-stock.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getFbsStockRegions, fbsStockQueryKeys } from '@/lib/api/fbs-stock'
import type { FbsStockRegionsResponse } from '@/types/fbs-stock'

export function useFbsStockRegions(enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<FbsStockRegionsResponse>({
    queryKey: fbsStockQueryKeys.regions(cabinetId),
    queryFn: async () => {
      if (!cabinetId) throw new Error('useFbsStockRegions: cabinetId is required')
      return getFbsStockRegions()
    },
    enabled: enabled && cabinetId != null,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  })
}
