'use client'

/**
 * useAcquiringReportDetail — Epic 90-FE Story 90.1-FE
 *
 * TanStack Query hook for GET /v1/analytics/acquiring/reports/:id/detail
 * Returns per-transaction detail for a specific acquiring report by ID.
 *
 * Cache policy: 30 min stale / 60 min gc / retry 1 / NO refetchInterval.
 *
 * CLAUDE.md anti-pattern #2 compliance: guard-capture `safeReportId`, no !.
 * CLAUDE.md anti-pattern #5 compliance: selector named `authState`.
 *
 * queryKey uses `reportId ?? -1` as sentinel when reportId is null —
 * enabled: false prevents execution, key just needs to be deterministic.
 *
 * @see src/lib/api/acquiring-analytics.ts
 * @see src/types/acquiring-analytics.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getAcquiringReportDetail, acquiringQueryKeys } from '@/lib/api/acquiring-analytics'
import type { AcquiringDetailResponse } from '@/types/acquiring-analytics'

export function useAcquiringReportDetail(reportId: number | null, enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<AcquiringDetailResponse>({
    queryKey: acquiringQueryKeys.reportDetail(reportId ?? -1),
    queryFn: async () => {
      // reportId = 0 is never a valid backend report ID (normalizer uses 0 as a
      // "missing field" sentinel). Tighten guard to prevent 400s on corrupted list data.
      // Review fix M-3.
      if (reportId == null || reportId <= 0) throw new Error('reportId must be a positive number')
      const safeReportId = reportId
      return getAcquiringReportDetail({ reportId: safeReportId })
    },
    // reportId = 0 is never a valid backend report ID (normalizer uses 0 as a
    // "missing field" sentinel). Tighten guard to prevent 400s on corrupted list data.
    // Review fix M-3.
    enabled: enabled && cabinetId != null && reportId != null && reportId > 0,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  })
}
