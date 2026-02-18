/**
 * usePipelineGrid — Epic 68-FE (Story 68.1)
 * Heatmap grid data with smart polling (30s current, 120s historical).
 * Lazy-loaded: only fetches when heatmap tab is active.
 * @see docs/request-backend/149-EPIC-67-PIPELINE-HEALTH-DASHBOARD-API.md
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getPipelineHealthGrid, monitoringQueryKeys } from '@/lib/api/monitoring'
import type { PipelineHealthGrid, GridParams } from '../types/monitoring'

/** Smart polling: shorter for current period, longer for historical */
function getRefetchInterval(isCurrentPeriod: boolean): number {
  return isCurrentPeriod ? 30_000 : 120_000
}

export function usePipelineGrid(params: GridParams = {}, enabled = true) {
  const cabinetId = useAuthStore(state => state.cabinetId)

  // Determine if period includes "now" for smart polling
  const isCurrentPeriod = !params.to || new Date(params.to) >= new Date()
  const interval = getRefetchInterval(isCurrentPeriod)

  return useQuery<PipelineHealthGrid>({
    queryKey: monitoringQueryKeys.grid(cabinetId ?? '', params),
    queryFn: () => getPipelineHealthGrid(cabinetId!, params),
    enabled: enabled && !!cabinetId,
    refetchInterval: interval,
    staleTime: interval - 5_000,
    gcTime: 300_000,
    retry: 1,
  })
}
