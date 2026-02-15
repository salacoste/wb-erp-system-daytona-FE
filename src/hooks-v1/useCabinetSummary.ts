/**
 * Cabinet Summary Hook
 * Story 6.4-FE: Cabinet Summary Dashboard
 *
 * Fetches cabinet-level KPI data from /v1/analytics/weekly/cabinet-summary endpoint.
 * Supports both "weeks" param (4, 8, 12) and explicit weekStart/weekEnd range.
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  CabinetSummaryResponse,
  CabinetSummaryParams,
} from '@/types/analytics'

/**
 * Query key factory for cabinet summary
 */
const cabinetSummaryKeys = {
  all: ['analytics', 'cabinet-summary'] as const,
  byParams: (params: CabinetSummaryParams) =>
    [...cabinetSummaryKeys.all, params] as const,
}

/**
 * Hook to fetch cabinet summary data
 *
 * @param params - Query parameters (weeks OR weekStart/weekEnd)
 * @returns React Query result with cabinet summary data
 *
 * @example
 * // Using weeks param (default: 4)
 * const { data, isLoading } = useCabinetSummary({ weeks: 4 })
 *
 * @example
 * // Using explicit date range
 * const { data } = useCabinetSummary({ weekStart: '2025-W44', weekEnd: '2025-W47' })
 */
export function useCabinetSummary(params: CabinetSummaryParams = {}) {
  const { weeks = 4, weekStart, weekEnd } = params

  return useQuery({
    queryKey: cabinetSummaryKeys.byParams({ weeks, weekStart, weekEnd }),
    queryFn: async () => {
      const queryParams = new URLSearchParams()

      // Story 6.4-FE: Support both weeks param and explicit range
      if (weekStart && weekEnd) {
        queryParams.append('weekStart', weekStart)
        queryParams.append('weekEnd', weekEnd)
      } else {
        queryParams.append('weeks', String(weeks))
      }

      // Story 6.4: Path is /v1/analytics/weekly/cabinet-summary
      // Controller: WeeklyAnalyticsController with prefix 'v1/analytics/weekly'
      return apiClient.get<CabinetSummaryResponse>(
        `/v1/analytics/weekly/cabinet-summary?${queryParams.toString()}`
      )
    },
    staleTime: 60000, // 1 minute - cabinet summary changes infrequently
    refetchOnWindowFocus: true,
  })
}

/**
 * Invalidation helper for cache management
 */
export const invalidateCabinetSummary = cabinetSummaryKeys.all
