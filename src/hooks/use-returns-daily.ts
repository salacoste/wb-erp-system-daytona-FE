/**
 * Returns Daily Trend Hook
 *
 * TanStack Query v5 hook for fetching daily return trends.
 * Consumes GET /v1/analytics/returns/daily via returns-daily API client.
 */

import { useQuery } from '@tanstack/react-query'
import { getReturnsDailyTrends, returnsDailyQueryKeys } from '@/lib/api/returns-daily'
import type { ReturnsDailyResponse } from '@/types/returns-daily'

/**
 * Hook to fetch daily return trend data.
 *
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @returns Query result with ReturnsDailyResponse data
 */
export function useReturnsDailyTrends(from: string, to: string) {
  return useQuery<ReturnsDailyResponse, Error>({
    queryKey: returnsDailyQueryKeys.trends(from, to),
    queryFn: () => getReturnsDailyTrends(from, to),
    enabled: !!from && !!to,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}
