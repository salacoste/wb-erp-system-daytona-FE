/**
 * React Query Hooks for Orders Volume
 * Story 61.3-FE: Orders Volume API Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Hooks for fetching orders volume data with period conversion.
 *
 * @deprecated This hook has zero page-level consumers. Orders/volume API
 *   lacks COGS, gross_profit, and margin_pct fields (see MEMORY.md
 *   "COGS по заказам = 0"). New pages should use `orders/trends` which
 *   provides richer per-day data. Retained until a migration story removes
 *   the underlying API client module.
 *
 * @internal No pages consume this hook; kept for backward-compat test fixtures.
 *
 * @see docs/stories/epic-61/story-61.3-fe-orders-volume-api.md
 */

import { useQuery } from '@tanstack/react-query'
import { getOrdersVolume, transformToMetrics, ordersVolumeQueryKeys } from '@/lib/api/orders-volume'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import { getPreviousWeek, getPreviousMonth } from './useOrdersVolume.helpers'
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
