'use client'

/**
 * useAcquiringReports — Epic 90-FE Story 90.1-FE
 *
 * TanStack Query hook for GET /v1/analytics/acquiring/reports?from=&to=
 * Returns the list of acquiring reports for the given date range.
 *
 * Cache policy: 30 min stale / 60 min gc / retry 1 / NO refetchInterval.
 * Rationale: backend caches 30 min; acquiring data is slow-moving (batch
 * generated), so user-triggered refresh is sufficient — no auto-polling.
 *
 * CLAUDE.md anti-pattern #2 compliance: explicit guard in queryFn, no cabinetId!.
 * CLAUDE.md anti-pattern #5 compliance: selector named `authState`.
 *
 * @see src/lib/api/acquiring-analytics.ts
 * @see src/types/acquiring-analytics.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getAcquiringReports, acquiringQueryKeys } from '@/lib/api/acquiring-analytics'
import type { AcquiringListResponse } from '@/types/acquiring-analytics'

export function useAcquiringReports(from: string, to: string, enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<AcquiringListResponse>({
    queryKey: acquiringQueryKeys.reports({ from, to }),
    queryFn: async () => {
      return getAcquiringReports({ from, to })
    },
    enabled: enabled && cabinetId != null && from !== '' && to !== '',
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  })
}
