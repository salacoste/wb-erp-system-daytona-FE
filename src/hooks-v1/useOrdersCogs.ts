/**
 * React Query Hook for Orders with COGS
 * Story 61.4-FE: COGS for Orders Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Hook for fetching orders volume enriched with COGS data.
 *
 * Types extracted to orders-cogs-types.ts (Epic 74)
 * Helpers extracted to orders-cogs-helpers.ts (Epic 74)
 *
 * @see docs/stories/epic-61/story-61.4-fe-orders-cogs.md
 */

import { useQuery } from '@tanstack/react-query'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import type { OrdersCogsMetrics, OrdersCogsParams } from '@/types/orders-cogs'
import { ordersCogsQueryKeys, type UseOrdersCogsOptions } from './orders-cogs-types'
import {
  getOrdersWithCogs,
  transformToCogsMetrics,
  getPreviousWeek,
  getPreviousMonth,
} from './orders-cogs-helpers'

// Re-export for backward compatibility
export { ordersCogsQueryKeys }
export type { UseOrdersCogsOptions }

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to fetch orders with COGS data for margin analysis
 *
 * @example
 * const { data, isLoading } = useOrdersCogs({
 *   periodType: 'week',
 *   period: '2026-W05',
 *   withDailyBreakdown: true,
 * })
 *
 * // Access margin data
 * console.log(data?.marginPct, data?.grossProfit)
 */
export function useOrdersCogs(options: UseOrdersCogsOptions) {
  const { periodType, period, withDailyBreakdown = false, enabled = true } = options

  // Check if query should be enabled
  const isEnabled = enabled && !!period

  // Convert period to date range (only if enabled to avoid throwing on empty period)
  const dateRange =
    isEnabled && period
      ? periodType === 'week'
        ? weekToDateRange(period)
        : monthToDateRange(period)
      : { from: '', to: '' }

  const params: OrdersCogsParams = {
    from: dateRange.from,
    to: dateRange.to,
    aggregation: withDailyBreakdown ? 'day' : undefined,
    include_cogs: true,
  }

  return useQuery<OrdersCogsMetrics, Error>({
    queryKey: ordersCogsQueryKeys.byRangeWithOptions(
      params.from || 'disabled',
      params.to || 'disabled',
      params.aggregation || 'total',
      true
    ),
    queryFn: async () => {
      const response = await getOrdersWithCogs(params)
      return transformToCogsMetrics(response)
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Note: retry controlled by QueryClient (default: 3 in prod, 0 in tests)
  })
}

// =============================================================================
// Comparison Hook
// =============================================================================

/**
 * Hook to fetch orders COGS with comparison to previous period
 * Story 61.11-FE: Previous Period Data Integration
 *
 * @example
 * const { current, previous, isLoading } = useOrdersCogsWithComparison({
 *   periodType: 'week',
 *   period: '2026-W05',
 * })
 */
export function useOrdersCogsWithComparison(options: UseOrdersCogsOptions) {
  const { enabled = true } = options

  // Calculate previous period (handle empty period gracefully)
  const previousPeriod = options.period
    ? options.periodType === 'week'
      ? getPreviousWeek(options.period)
      : getPreviousMonth(options.period)
    : ''

  const currentQuery = useOrdersCogs(options)

  const previousQuery = useOrdersCogs({
    ...options,
    period: previousPeriod,
    enabled: enabled && !!previousPeriod,
  })

  // Handle previous period errors gracefully - return undefined instead of error
  const previousData = previousQuery.isError ? undefined : previousQuery.data

  // Determine combined loading state
  const isLoading = currentQuery.isLoading || (previousQuery.isLoading && !previousQuery.isError)

  // Current period error is critical, previous period error is graceful
  const isError = currentQuery.isError
  const error = currentQuery.error

  return {
    current: currentQuery.data,
    previous: previousData,
    isLoading,
    isError,
    error,
  }
}
