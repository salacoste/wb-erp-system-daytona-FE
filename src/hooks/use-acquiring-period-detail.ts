'use client'

/**
 * useAcquiringPeriodDetail — Epic 90-FE Story 90.1-FE
 *
 * TanStack Query hook for GET /v1/analytics/acquiring/detail?from=&to=
 * Returns cross-report per-transaction detail for the given date range.
 *
 * Cache policy: 30 min stale / 60 min gc / retry 1 / NO refetchInterval.
 *
 * CLAUDE.md anti-pattern #2 compliance: explicit guard in queryFn, no cabinetId!.
 * CLAUDE.md anti-pattern #5 compliance: selector named `authState`.
 *
 * @see src/lib/api/acquiring-analytics.ts
 * @see src/types/acquiring-analytics.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getAcquiringPeriodDetail, acquiringQueryKeys } from '@/lib/api/acquiring-analytics'
import type { AcquiringDetailResponse } from '@/types/acquiring-analytics'

export function useAcquiringPeriodDetail(from: string, to: string, enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<AcquiringDetailResponse>({
    queryKey: acquiringQueryKeys.periodDetail({ from, to }),
    queryFn: async () => {
      return getAcquiringPeriodDetail({ from, to })
    },
    enabled: enabled && cabinetId != null && from !== '' && to !== '',
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  })
}
