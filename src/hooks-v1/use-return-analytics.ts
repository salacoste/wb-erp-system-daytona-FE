/**
 * Return Analytics React Query Hooks
 * Epic 71: Return Reasons & Anomaly Detection
 */

import { useQuery } from '@tanstack/react-query'
import {
  getReturnReasons,
  getReturnsBySku,
  returnQueryKeys,
  RETURN_CACHE,
} from '@/lib/api/return-analytics'
import type { ReturnsBySkuParams } from '@/types/analytics-epics-68-71'

/** Aggregated return reasons by category (for pie chart) */
export function useReturnReasons(from?: string, to?: string) {
  return useQuery({
    queryKey: returnQueryKeys.reasons(from, to),
    queryFn: () => getReturnReasons(from, to, 'ru'),
    enabled: !!from && !!to,
    staleTime: RETURN_CACHE.staleTime,
    gcTime: RETURN_CACHE.gcTime,
    retry: 1,
  })
}

/** Per-SKU returns with anomaly flags (cursor pagination) */
export function useReturnsBySku(from?: string, to?: string, params?: Partial<ReturnsBySkuParams>) {
  const fullParams: ReturnsBySkuParams = {
    from,
    to,
    limit: 100,
    ...params,
  }

  return useQuery({
    queryKey: returnQueryKeys.bySku(fullParams),
    queryFn: () => getReturnsBySku(fullParams),
    enabled: !!from && !!to,
    staleTime: RETURN_CACHE.staleTime,
    gcTime: RETURN_CACHE.gcTime,
    retry: 1,
  })
}
