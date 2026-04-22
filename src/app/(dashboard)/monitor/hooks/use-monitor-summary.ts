/**
 * useMonitorSummary — Epic 92-FE Story 92.1
 * Single-endpoint hook for GET /v1/analytics/monitor/summary.
 * Replaces the originally-planned 8-parallel-request architecture.
 *
 * Cache policy: 5 min refetch / 4 min stale / 10 min gc
 * Rationale: backend caches for 10 min; frontend refresh ≤ backend TTL.
 *
 * CLAUDE.md anti-pattern #2 compliance: guard-capture pattern, no cabinetId! assertion.
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getMonitorSummary, monitorSummaryQueryKeys } from '@/lib/api/monitor-summary'
import type { MonitorSummaryResponse } from '../types/monitor-summary'

const CACHE_CONFIG = {
  refetchInterval: 5 * 60_000, // 5 min — within backend 10 min TTL
  staleTime: 4 * 60_000, // 4 min — refresh just before backend cache expires
  gcTime: 10 * 60_000,
  retry: 1,
} as const

export function useMonitorSummary(enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<MonitorSummaryResponse>({
    queryKey: monitorSummaryQueryKeys.byCabinet(cabinetId),
    queryFn: async () => {
      if (!cabinetId) throw new Error('cabinetId required')
      const safeCabinetId = cabinetId
      return getMonitorSummary(safeCabinetId)
    },
    enabled: enabled && cabinetId != null,
    ...CACHE_CONFIG,
  })
}
