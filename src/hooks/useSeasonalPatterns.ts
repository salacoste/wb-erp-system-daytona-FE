/**
 * Seasonal Patterns Hook
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Hook for fetching seasonal order patterns data.
 * Returns monthly patterns, weekday patterns, and insights.
 *
 * @see docs/stories/epic-63/story-63.8-fe-orders-seasonal-patterns.md
 */

import { useQuery } from '@tanstack/react-query'
import { getSeasonalPatterns, ordersVolumeQueryKeys } from '@/lib/api/orders-volume'
import type { SeasonalPatternsResponse } from '@/types/orders-volume'

// =============================================================================
// Hook Options
// =============================================================================

export interface UseSeasonalPatternsOptions {
  /** Number of months to analyze (default: 12, max: 24) */
  months?: number
  /** Enable/disable query */
  enabled?: boolean
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to fetch seasonal order patterns
 *
 * @example
 * const { data, isLoading, error, refetch } = useSeasonalPatterns({
 *   months: 12,
 * })
 *
 * // data.patterns.monthly = [
 * //   { month: 'January', avgOrders: 2500, avgRevenue: 750000 },
 * //   ...
 * // ]
 * // data.insights = { peakMonth: 'December', lowMonth: 'July', peakDay: 'Saturday' }
 */
export function useSeasonalPatterns(options: UseSeasonalPatternsOptions = {}) {
  const { months = 12, enabled = true } = options

  return useQuery<SeasonalPatternsResponse, Error>({
    queryKey: ordersVolumeQueryKeys.seasonalPatterns(months),
    queryFn: () => getSeasonalPatterns({ months }),
    enabled,
    staleTime: 5 * 60_000, // 5 minutes (data changes slowly)
    gcTime: 60 * 60_000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

// Re-export types for convenience
export type { SeasonalPatternsResponse }
