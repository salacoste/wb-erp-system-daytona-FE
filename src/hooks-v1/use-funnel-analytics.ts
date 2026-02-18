/**
 * Funnel Analytics React Query Hooks
 * Epic 68: Marketing Funnel Analytics
 */

import { useQuery } from '@tanstack/react-query'
import {
  getFunnelData,
  getFunnelSyncStatus,
  funnelQueryKeys,
  FUNNEL_CACHE,
} from '@/lib/api/funnel-analytics'
import type { FunnelParams } from '@/types/analytics-epics-68-71'

/** Per-SKU funnel data with pagination and sorting */
export function useFunnelData(from: string, to: string, params?: Partial<FunnelParams>) {
  const fullParams: FunnelParams = {
    from,
    to,
    groupBy: 'product',
    limit: 50,
    offset: 0,
    ...params,
  }

  return useQuery({
    queryKey: funnelQueryKeys.data(fullParams),
    queryFn: () => getFunnelData(fullParams),
    enabled: !!from && !!to,
    staleTime: FUNNEL_CACHE.staleTime,
    gcTime: FUNNEL_CACHE.gcTime,
    retry: 1,
  })
}

/** Time series data for charts (groupBy=day) */
export function useFunnelTimeSeries(from: string, to: string, enabled = true) {
  const params: FunnelParams = { from, to, groupBy: 'day' }

  return useQuery({
    queryKey: funnelQueryKeys.timeSeries(from, to),
    queryFn: () => getFunnelData(params),
    enabled: enabled && !!from && !!to,
    staleTime: FUNNEL_CACHE.staleTime,
    gcTime: FUNNEL_CACHE.gcTime,
    retry: 1,
  })
}

/** Sync status — polls every 60s for freshness indicator */
export function useFunnelSyncStatus() {
  return useQuery({
    queryKey: funnelQueryKeys.syncStatus(),
    queryFn: getFunnelSyncStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  })
}
