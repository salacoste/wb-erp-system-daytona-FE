'use client'

/**
 * useFbsStockGroups — Epic 96-FE Story 96.11-FE
 *
 * TanStack Query hook for GET /v1/analytics/fbs/stock/groups?from=&to=
 * Returns product group breakdown of FBS stock for the given date range.
 *
 * Cache policy: 30 min stale / 60 min gc / retry 1 / NO refetchInterval.
 * Rationale: FBS stock is a batch-generated snapshot; user-triggered refresh sufficient.
 *
 * CLAUDE.md anti-pattern #2 compliance: explicit guard in queryFn, no cabinetId!.
 * CLAUDE.md anti-pattern #5 compliance: selector named `authState`.
 *
 * @see src/lib/api/fbs-stock.ts
 * @see src/types/fbs-stock.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getFbsStockGroups, fbsStockQueryKeys } from '@/lib/api/fbs-stock'
import type { FbsStockGroupsResponse } from '@/types/fbs-stock'

export function useFbsStockGroups(from: string, to: string, enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<FbsStockGroupsResponse>({
    queryKey: fbsStockQueryKeys.groups(cabinetId, { from, to }),
    queryFn: async () => {
      if (!cabinetId) throw new Error('useFbsStockGroups: cabinetId is required')
      return getFbsStockGroups({ from, to })
    },
    enabled: enabled && cabinetId != null && from !== '' && to !== '',
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  })
}
