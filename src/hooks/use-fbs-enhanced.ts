'use client'

/**
 * useFbsEnhanced — Epic 96-FE Story 96.13-FE
 *
 * TanStack Query hook for GET /v1/analytics/fbs/enhanced?from=&to=
 * Returns aggregated FBS analytics (5 sections) for the given date range.
 *
 * Cache policy: 30 min stale / 60 min gc / retry 1 / NO refetchInterval.
 * Rationale: FBS enhanced is a batch-generated snapshot; user-triggered refresh sufficient.
 *
 * CLAUDE.md anti-pattern #2 compliance: explicit guard in queryFn, no cabinetId!.
 * CLAUDE.md anti-pattern #5 compliance: selector named `authState`.
 *
 * @see src/lib/api/fbs-enhanced.ts
 * @see src/types/fbs-enhanced.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getFbsEnhanced, fbsEnhancedQueryKeys } from '@/lib/api/fbs-enhanced'
import type { FbsEnhancedResponse } from '@/types/fbs-enhanced'

export function useFbsEnhanced(from: string, to: string, enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<FbsEnhancedResponse>({
    queryKey: fbsEnhancedQueryKeys.view(cabinetId, { from, to }),
    queryFn: async () => {
      if (!cabinetId) throw new Error('useFbsEnhanced: cabinetId is required')
      return getFbsEnhanced({ from, to })
    },
    enabled: enabled && cabinetId != null && from !== '' && to !== '',
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  })
}
