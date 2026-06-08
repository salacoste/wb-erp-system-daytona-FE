/**
 * Buyout Daily Trend React Query Hook
 * GET /v1/analytics/buyout/daily
 */

import { useQuery } from '@tanstack/react-query'
import { getBuyoutDailyTrends, buyoutDailyKeys, BUYOUT_DAILY_CACHE } from '@/lib/api/buyout-daily'

/** Daily buyout rate trend for a date range */
export function useBuyoutDailyTrends(from: string, to: string) {
  return useQuery({
    queryKey: buyoutDailyKeys.range(from, to),
    queryFn: () => getBuyoutDailyTrends(from, to),
    enabled: !!from && !!to,
    staleTime: BUYOUT_DAILY_CACHE.staleTime,
    gcTime: BUYOUT_DAILY_CACHE.gcTime,
    retry: 1,
  })
}
