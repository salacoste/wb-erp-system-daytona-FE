/**
 * Daily Metrics React Query Hook
 *
 * React Query hook for fetching and aggregating daily metrics (Story 61.9-FE).
 * Combines data from orders, finance, and advertising APIs into DailyMetrics[].
 *
 * @see Story 61.9-FE: Daily Breakdown Support
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllDailyData, dailyAnalyticsQueryKeys } from '@/lib/api/daily-analytics'
import { aggregateDailyMetrics, fillMissingDays } from '@/lib/daily-helpers'
import type {
  DailyMetrics,
  UseDailyMetricsParams,
  UseDailyMetricsOptions,
} from '@/types/daily-metrics'

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to fetch and aggregate daily metrics.
 *
 * Fetches data from multiple APIs in parallel:
 * - Orders Volume API (with aggregation=day)
 * - Finance Summary API (with aggregation=day)
 * - Advertising API (with aggregation=day)
 *
 * Aggregates into DailyMetrics[] with:
 * - All days filled (no gaps)
 * - Sorted by date ascending
 * - Theoretical profit calculated
 *
 * @param params - Date range and mode (week/month)
 * @param options - Hook options (enabled, refetchInterval, ordersCogs)
 * @returns Query result with DailyMetrics[] data
 *
 * @example
 * // Week mode (7 days)
 * const { data, isLoading } = useDailyMetrics({
 *   from: '2026-01-26',
 *   to: '2026-02-01',
 *   mode: 'week',
 * })
 *
 * @example
 * // Month mode (28-31 days)
 * const { data } = useDailyMetrics({
 *   from: '2026-01-01',
 *   to: '2026-01-31',
 *   mode: 'month',
 * })
 *
 * @example
 * // With COGS for theoretical profit
 * const { data } = useDailyMetrics(
 *   { from: '2026-01-26', to: '2026-02-01', mode: 'week' },
 *   { ordersCogs: 50000 }
 * )
 */
export function useDailyMetrics(
  params: UseDailyMetricsParams,
  options: UseDailyMetricsOptions = {}
) {
  const { from, to, mode } = params
  const { enabled = true, refetchInterval, ordersCogs = 0 } = options

  return useQuery<DailyMetrics[], Error>({
    queryKey: dailyAnalyticsQueryKeys.metrics(from, to),
    queryFn: async () => {
      // Fetch all daily data sources in parallel
      const { ordersData, financeData, advertisingData } = await getAllDailyData(from, to)

      // Aggregate data from all sources
      const aggregatedData = aggregateDailyMetrics({
        ordersData,
        financeData,
        advertisingData,
        ordersCogs,
      })

      // Fill missing days with zeros
      const filledData = fillMissingDays(aggregatedData, from, to)

      console.info('[Daily Metrics] Processed daily data:', {
        mode,
        from,
        to,
        days: filledData.length,
        ordersDataCount: ordersData.length,
        financeDataCount: financeData.length,
        advertisingDataCount: advertisingData.length,
      })

      return filledData
    },
    enabled: enabled && !!from && !!to,
    // Story 61.9-FE: Use 5 minute staleTime for daily data
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to invalidate daily metrics queries.
 * Use after data changes to refresh daily metrics.
 *
 * @returns Function to invalidate daily metrics queries
 *
 * @example
 * const invalidateDailyMetrics = useInvalidateDailyMetrics()
 * // After data changes
 * invalidateDailyMetrics()
 */
export function useInvalidateDailyMetrics() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Daily Metrics] Invalidating daily metrics queries')
    queryClient.invalidateQueries({ queryKey: dailyAnalyticsQueryKeys.all })
  }
}

/**
 * Hook to prefetch daily metrics data.
 * Useful for preloading data before navigation.
 *
 * @returns Function to prefetch daily metrics
 *
 * @example
 * const prefetchDailyMetrics = usePrefetchDailyMetrics()
 * // Prefetch on hover
 * prefetchDailyMetrics('2026-01-26', '2026-02-01')
 */
export function usePrefetchDailyMetrics() {
  const queryClient = useQueryClient()

  return async (from: string, to: string, ordersCogs = 0) => {
    console.info('[Daily Metrics] Prefetching daily metrics:', { from, to })
    await queryClient.prefetchQuery({
      queryKey: dailyAnalyticsQueryKeys.metrics(from, to),
      queryFn: async () => {
        const { ordersData, financeData, advertisingData } = await getAllDailyData(from, to)
        const aggregatedData = aggregateDailyMetrics({
          ordersData,
          financeData,
          advertisingData,
          ordersCogs,
        })
        return fillMissingDays(aggregatedData, from, to)
      },
      staleTime: 5 * 60 * 1000,
    })
  }
}

// ============================================================================
// Exports
// ============================================================================

export { dailyAnalyticsQueryKeys }
