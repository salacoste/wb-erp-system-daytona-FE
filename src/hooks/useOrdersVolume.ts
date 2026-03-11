/**
 * React Query Hooks for Orders Volume
 * Story 61.3-FE: Orders Volume API Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Hooks for fetching orders volume data with period conversion.
 *
 * @see docs/stories/epic-61/story-61.3-fe-orders-volume-api.md
 */

import { useQuery } from '@tanstack/react-query'
import { getISOWeek, getISOWeekYear, subMonths, format } from 'date-fns'
import { getOrdersVolume, transformToMetrics, ordersVolumeQueryKeys } from '@/lib/api/orders-volume'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import type { OrdersVolumeParams, OrdersVolumeMetrics } from '@/types/orders-volume'

// Re-export query keys for external use
export { ordersVolumeQueryKeys }

// =============================================================================
// Hook Options Interface
// =============================================================================

export interface UseOrdersVolumeOptions {
  /** Period type: 'week' or 'month' */
  periodType: 'week' | 'month'
  /** ISO week (YYYY-Www) or month (YYYY-MM) */
  period: string
  /** Include daily breakdown in response */
  withDailyBreakdown?: boolean
  /** Enable/disable query */
  enabled?: boolean
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to fetch orders volume for dashboard
 * Converts ISO week/month to date range and fetches volume data.
 *
 * @example
 * const { data, isLoading } = useOrdersVolume({
 *   periodType: 'week',
 *   period: '2026-W05',
 *   withDailyBreakdown: true,
 * })
 *
 * @example
 * // Month period
 * const { data } = useOrdersVolume({
 *   periodType: 'month',
 *   period: '2026-01',
 * })
 */
export function useOrdersVolume(options: UseOrdersVolumeOptions) {
  const { periodType, period, withDailyBreakdown = false, enabled = true } = options

  // Convert period to date range
  const dateRange = periodType === 'week' ? weekToDateRange(period) : monthToDateRange(period)

  const params: OrdersVolumeParams = {
    from: dateRange.from,
    to: dateRange.to,
    aggregation: withDailyBreakdown ? 'day' : undefined,
  }

  return useQuery<OrdersVolumeMetrics, Error>({
    queryKey: ordersVolumeQueryKeys.byRangeWithAggregation(
      params.from,
      params.to,
      params.aggregation || 'total'
    ),
    queryFn: async () => {
      const response = await getOrdersVolume(params)
      return transformToMetrics(response)
    },
    enabled: enabled && !!period,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

// =============================================================================
// Comparison Hook
// =============================================================================

/**
 * Hook to fetch orders volume with comparison to previous period
 *
 * @example
 * const { current, previous, isLoading } = useOrdersVolumeWithComparison({
 *   periodType: 'week',
 *   period: '2026-W05',
 * })
 */
export function useOrdersVolumeWithComparison(options: UseOrdersVolumeOptions) {
  const currentQuery = useOrdersVolume(options)

  // Calculate previous period
  const previousPeriod =
    options.periodType === 'week'
      ? getPreviousWeek(options.period)
      : getPreviousMonth(options.period)

  const previousQuery = useOrdersVolume({
    ...options,
    period: previousPeriod,
  })

  return {
    current: currentQuery.data,
    previous: previousQuery.data,
    isLoading: currentQuery.isLoading || previousQuery.isLoading,
    isError: currentQuery.isError || previousQuery.isError,
    error: currentQuery.error || previousQuery.error,
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get previous ISO week string
 * Handles year boundary: "2026-W01" -> "2025-W52"
 *
 * @param week - ISO week string (YYYY-Www)
 * @returns Previous week in ISO format
 */
function getPreviousWeek(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, yearStr, weekStr] = match
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)

  // If week number is 1, we need to go to previous year's last week
  if (weekNum === 1) {
    // Go to last week of previous year
    const lastYearDec = new Date(year - 1, 11, 28) // Dec 28 is always in last week
    const lastWeek = getISOWeek(lastYearDec)
    const lastWeekYear = getISOWeekYear(lastYearDec)
    return `${lastWeekYear}-W${lastWeek.toString().padStart(2, '0')}`
  }

  // Simple case: just decrement week number
  return `${year}-W${(weekNum - 1).toString().padStart(2, '0')}`
}

/**
 * Get previous month string
 * Handles year boundary: "2026-01" -> "2025-12"
 *
 * @param month - Month string (YYYY-MM)
 * @returns Previous month in YYYY-MM format
 */
function getPreviousMonth(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/)
  if (!match) return month

  const [, yearStr, monthStr] = match
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)

  // Create a date and subtract 1 month
  const date = new Date(year, monthNum - 1, 1)
  const prevDate = subMonths(date, 1)

  return format(prevDate, 'yyyy-MM')
}
