/**
 * Orders Status Breakdown Hook
 * Story 63.7-FE: Orders Status Breakdown Chart
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Hook for fetching orders status breakdown data.
 * Uses orders volume API and transforms to chart-ready format.
 *
 * @see docs/stories/epic-63/story-63.7-fe-orders-status-breakdown.md
 */

import { useQuery } from '@tanstack/react-query'
import {
  getOrdersVolume,
  transformToStatusBreakdown,
  ordersVolumeQueryKeys,
} from '@/lib/api/orders-volume'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import type { StatusBreakdownData } from '@/types/orders-volume'

// =============================================================================
// Hook Options
// =============================================================================

export interface UseOrdersStatusBreakdownOptions {
  /** Period type: 'week' or 'month' */
  periodType: 'week' | 'month'
  /** ISO week (YYYY-Www) or month (YYYY-MM) */
  period: string
  /** Enable/disable query */
  enabled?: boolean
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to fetch orders status breakdown for dashboard charts
 *
 * @example
 * const { data, isLoading, error, refetch } = useOrdersStatusBreakdown({
 *   periodType: 'week',
 *   period: '2026-W05',
 * })
 *
 * // data.items = [
 * //   { status: 'complete', count: 400, percentage: 80.0 },
 * //   { status: 'confirm', count: 50, percentage: 10.0 },
 * //   ...
 * // ]
 */
export function useOrdersStatusBreakdown(options: UseOrdersStatusBreakdownOptions) {
  const { periodType, period, enabled = true } = options

  // Convert period to date range
  const dateRange = periodType === 'week' ? weekToDateRange(period) : monthToDateRange(period)

  return useQuery<StatusBreakdownData, Error>({
    queryKey: ordersVolumeQueryKeys.statusBreakdown(dateRange.from, dateRange.to),
    queryFn: async () => {
      const response = await getOrdersVolume({
        from: dateRange.from,
        to: dateRange.to,
      })
      return transformToStatusBreakdown(response)
    },
    enabled: enabled && !!period,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
    retry: 1,
  })
}

// Re-export for convenience
export type { StatusBreakdownData }
