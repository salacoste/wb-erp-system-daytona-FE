/**
 * Trends Data Hook
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * TanStack Query hook for fetching historical trends data.
 *
 * @see docs/stories/epic-63/story-63.12-fe-historical-trends-section.md
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { apiClient } from '@/lib/api-client'
import { getWeekRange } from '@/lib/iso-week-utils'
import type { WeeklyTrendsResponse, WeeklyTrendDataPoint, TrendMetricSummary } from '@/types/api'

export interface UseTrendsDataOptions {
  /** Current week in ISO format */
  currentWeek: string
  /** Number of weeks to fetch */
  weeks: 4 | 8 | 12
  /** Whether the query is enabled */
  enabled?: boolean
}

export interface TrendsDataResult {
  /** Trend data points */
  data: WeeklyTrendDataPoint[]
  /** Summary statistics by metric */
  summary: Record<string, TrendMetricSummary> | undefined
  /** Period info */
  period: {
    from: string
    to: string
    weeks_count: number
  }
}

/**
 * Query key factory for trends data
 */
export const trendsQueryKeys = {
  all: ['trends'] as const,
  byRange: (from: string, to: string) => [...trendsQueryKeys.all, from, to] as const,
}

/**
 * Calculate from/to weeks for the trends range
 */
function calculateWeekRange(currentWeek: string, numWeeks: number): { from: string; to: string } {
  // Get array of weeks going backward
  const weekArray = getWeekRange(numWeeks, { startWeek: currentWeek, direction: 'backward' })
  // from is the oldest (last in array), to is the current (first in array)
  return {
    from: weekArray[weekArray.length - 1],
    to: weekArray[0],
  }
}

/**
 * Hook for fetching historical trends data
 */
export function useTrendsData(options: UseTrendsDataOptions) {
  const { currentWeek, weeks, enabled = true } = options

  // Calculate week range
  const { from, to } = useMemo(() => calculateWeekRange(currentWeek, weeks), [currentWeek, weeks])

  return useQuery({
    queryKey: trendsQueryKeys.byRange(from, to),
    queryFn: async (): Promise<TrendsDataResult> => {
      // Fetch all metrics with summary
      const metrics = ['wb_sales_gross', 'payout_total', 'logistics_cost', 'storage_cost'].join(',')

      const endpoint = `/v1/analytics/weekly/trends?from=${from}&to=${to}&metrics=${metrics}&include_summary=true`

      const response = await apiClient.get<WeeklyTrendsResponse>(endpoint)

      return {
        data: response.data || [],
        summary: response.summary,
        period: response.period,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: enabled && !!currentWeek,
    retry: 1,
  })
}
