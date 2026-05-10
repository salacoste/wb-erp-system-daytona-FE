'use client'

/**
 * useFbsStockSizes — Epic 96-FE Story 96.11-FE
 *
 * TanStack Query hook for GET /v1/analytics/fbs/stock/sizes?from=&to=&nm_id=
 * Returns size breakdown of FBS stock for the given date range, optionally
 * filtered by WB article (nm_id).
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
import { getFbsStockSizes, fbsStockQueryKeys } from '@/lib/api/fbs-stock'
import type { FbsStockSizesResponse } from '@/types/fbs-stock'

export function useFbsStockSizes(from: string, to: string, nmId?: number, enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<FbsStockSizesResponse>({
    queryKey: fbsStockQueryKeys.sizes(cabinetId, { from, to, nmId }),
    queryFn: async () => {
      if (!cabinetId) throw new Error('useFbsStockSizes: cabinetId is required')
      return getFbsStockSizes({ from, to, nmId })
    },
    enabled: enabled && cabinetId != null && from !== '' && to !== '',
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  })
}
