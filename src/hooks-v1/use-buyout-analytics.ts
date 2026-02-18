/**
 * Buyout Analytics React Query Hooks
 * Epic 69: Buyout Rate Analytics
 */

import { useQuery } from '@tanstack/react-query'
import {
  getBuyoutBySku,
  getBuyoutSummary,
  buyoutQueryKeys,
  BUYOUT_CACHE,
} from '@/lib/api/buyout-analytics'
import type { BuyoutBySkuParams, BuyoutSource } from '@/types/analytics-epics-68-71'

/** Per-SKU buyout rates with trend/confidence */
export function useBuyoutBySku(from: string, to: string, params?: Partial<BuyoutBySkuParams>) {
  const fullParams: BuyoutBySkuParams = {
    from,
    to,
    source: 'blended',
    trend: true,
    limit: 50,
    offset: 0,
    ...params,
  }

  return useQuery({
    queryKey: buyoutQueryKeys.bySku(fullParams),
    queryFn: () => getBuyoutBySku(fullParams),
    enabled: !!from && !!to,
    staleTime: BUYOUT_CACHE.staleTime,
    gcTime: BUYOUT_CACHE.gcTime,
    retry: 1,
  })
}

/** Cabinet-level summary with top decliners */
export function useBuyoutSummary(from: string, to: string, source?: BuyoutSource) {
  const params = { from, to, source }

  return useQuery({
    queryKey: buyoutQueryKeys.summary(params),
    queryFn: () => getBuyoutSummary(params),
    enabled: !!from && !!to,
    staleTime: BUYOUT_CACHE.staleTime,
    gcTime: BUYOUT_CACHE.gcTime,
    retry: 1,
  })
}
