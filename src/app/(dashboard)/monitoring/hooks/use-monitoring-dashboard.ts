/**
 * useMonitoringDashboard — Epic 68-FE (Story 68.1)
 * Lightweight dashboard summary with 60s polling.
 * @see docs/request-backend/149-EPIC-67-PIPELINE-HEALTH-DASHBOARD-API.md
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getMonitoringDashboard, monitoringQueryKeys } from '@/lib/api/monitoring'
import type { MonitoringDashboard } from '../types/monitoring'

/** Cache config matching backend 60s TTL */
const DASHBOARD_CACHE = {
  refetchInterval: 60_000,
  staleTime: 50_000,
  gcTime: 300_000,
  retry: 1,
} as const

export function useMonitoringDashboard(enabled = true) {
  const cabinetId = useAuthStore(state => state.cabinetId)

  return useQuery<MonitoringDashboard>({
    queryKey: monitoringQueryKeys.dashboard(cabinetId ?? ''),
    queryFn: () => getMonitoringDashboard(cabinetId!),
    enabled: enabled && !!cabinetId,
    ...DASHBOARD_CACHE,
  })
}
