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
import { useAuthStore } from '@/stores/authStore'

/** Aggregated return reasons by category (for pie chart) */
export function useReturnReasons(from?: string, to?: string) {
  const { cabinetId } = useAuthStore()

  return useQuery({
    queryKey: returnQueryKeys.reasons({ cabinetId: cabinetId ?? '', from, to }),
    queryFn: () => getReturnReasons({ cabinetId: cabinetId!, from, to, locale: 'ru' }),
    enabled: !!cabinetId,
    staleTime: RETURN_CACHE.staleTime,
    gcTime: RETURN_CACHE.gcTime,
    retry: 1,
  })
}

/** Per-SKU returns with anomaly flags (cursor pagination) */
export function useReturnsBySku(from?: string, to?: string, params?: Partial<ReturnsBySkuParams>) {
  const { cabinetId } = useAuthStore()

  const fullParams: ReturnsBySkuParams = {
    cabinetId: cabinetId ?? '',
    from,
    to,
    limit: 100,
    ...params,
  }

  return useQuery({
    queryKey: returnQueryKeys.bySku(fullParams),
    queryFn: () => getReturnsBySku({ ...fullParams, cabinetId: cabinetId! }),
    enabled: !!cabinetId,
    staleTime: RETURN_CACHE.staleTime,
    gcTime: RETURN_CACHE.gcTime,
    retry: 1,
  })
}
