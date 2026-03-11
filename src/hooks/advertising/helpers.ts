/**
 * Advertising Analytics Helper Hooks
 * Epic 33-FE: Advertising Analytics
 *
 * Utility hooks for advertising queries:
 * - useInvalidateAdvertisingQueries
 * - useInvalidateAnalyticsQueries
 * - usePrefetchAdvertisingAnalytics
 */

import { useQueryClient } from '@tanstack/react-query'
import { getAdvertisingAnalytics } from '@/lib/api/advertising-analytics'
import { advertisingQueryKeys } from './query-keys'
import type { AdvertisingAnalyticsParams } from '@/types/advertising-analytics'

/**
 * Hook to invalidate all advertising queries.
 * Use after data changes to refresh all advertising analytics data.
 *
 * @returns Function to invalidate all advertising queries
 *
 * @example
 * const invalidateAdvertising = useInvalidateAdvertisingQueries();
 * invalidateAdvertising();
 */
export function useInvalidateAdvertisingQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Advertising Analytics] Invalidating all advertising queries')
    queryClient.invalidateQueries({ queryKey: advertisingQueryKeys.all })
  }
}

/**
 * Hook to invalidate only analytics queries (not campaigns or sync status).
 * Use when only analytics data needs refresh.
 *
 * @returns Function to invalidate analytics queries
 */
export function useInvalidateAnalyticsQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Advertising Analytics] Invalidating analytics queries')
    queryClient.invalidateQueries({
      queryKey: [...advertisingQueryKeys.all, 'analytics'],
    })
  }
}

/**
 * Hook to prefetch advertising analytics data.
 * Useful for preloading data before navigation.
 *
 * @returns Function to prefetch analytics data
 *
 * @example
 * const prefetchAnalytics = usePrefetchAdvertisingAnalytics();
 * prefetchAnalytics({ from: '2025-12-08', to: '2025-12-21' });
 */
export function usePrefetchAdvertisingAnalytics() {
  const queryClient = useQueryClient()

  return (params: AdvertisingAnalyticsParams) => {
    console.info('[Advertising Analytics] Prefetching analytics:', params)
    queryClient.prefetchQuery({
      queryKey: advertisingQueryKeys.analytics(params),
      queryFn: () => getAdvertisingAnalytics(params),
      staleTime: 30000,
    })
  }
}
