/**
 * Hook for fetching margin trends over time
 * Story 4.7: Margin Analysis by Time Period
 *
 * Uses the margin trends endpoint to fetch time-series margin data
 * Reference: docs/backend-response-10-margin-trends-endpoint.md
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { MarginTrendPoint, MarginTrendsResponse } from '@/types/api'

/**
 * Query parameters for margin trends endpoint
 * Use either:
 * - weeks (relative): Number of recent weeks to fetch
 * - weekStart & weekEnd: Specific ISO week range
 */
export interface MarginTrendsQueryParams {
  /** Number of recent weeks (e.g., 12 for last 12 weeks) */
  weeks?: number
  /** ISO week start (e.g., "2025-W40") - use with weekEnd */
  weekStart?: string
  /** ISO week end (e.g., "2025-W47") - use with weekStart */
  weekEnd?: string
  /** Include COGS in calculation (default: true) */
  includeCogs?: boolean
}

/**
 * Hook to fetch margin trends over multiple weeks
 *
 * @param params - Query parameters for time range selection
 * @returns TanStack Query result with margin trend data
 *
 * @example
 * // Fetch last 12 weeks
 * const { data } = useMarginTrends({ weeks: 12 })
 *
 * @example
 * // Fetch specific week range
 * const { data } = useMarginTrends({ weekStart: '2025-W40', weekEnd: '2025-W47' })
 */
export function useMarginTrends(params: MarginTrendsQueryParams) {
  const { weeks, weekStart, weekEnd, includeCogs = true } = params

  // Validate parameters
  if (!weeks && (!weekStart || !weekEnd)) {
    throw new Error('useMarginTrends: Must provide either "weeks" or both "weekStart" and "weekEnd"')
  }

  if (weeks && (weekStart || weekEnd)) {
    throw new Error('useMarginTrends: Cannot use both "weeks" and "weekStart/weekEnd" parameters')
  }

  return useQuery({
    queryKey: ['analytics', 'margin-trends', { weeks, weekStart, weekEnd, includeCogs }],
    queryFn: async (): Promise<MarginTrendPoint[]> => {
      try {
        // Build query string
        const queryParams = new URLSearchParams()

        if (weeks !== undefined) {
          queryParams.append('weeks', weeks.toString())
        } else if (weekStart && weekEnd) {
          queryParams.append('weekStart', weekStart)
          queryParams.append('weekEnd', weekEnd)
        }

        queryParams.append('includeCogs', includeCogs.toString())

        const endpoint = `/v1/analytics/weekly/margin-trends?${queryParams.toString()}`
        console.info(`[MarginTrends] Fetching margin trends: ${endpoint}`)

        // API returns MarginTrendsResponse { data: MarginTrendPoint[], pagination?, message? }
        const response = await apiClient.get<MarginTrendsResponse>(endpoint)

        // Extract data array from response
        const trends = response.data || []

        console.info(`[MarginTrends] Received ${trends.length} data points`)

        // Sort by week ascending (oldest to newest for chart display)
        trends.sort((a, b) => a.week.localeCompare(b.week))

        return trends
      } catch (error) {
        console.error('[MarginTrends] Failed to fetch margin trends:', error)

        if (error instanceof Error && 'response' in error) {
          const httpError = error as { response?: { status?: number; data?: { error?: { message?: string } } } }

          // Handle specific error cases
          if (httpError.response?.status === 404) {
            console.warn('[MarginTrends] No data available for requested time range')
            return []
          }

          if (httpError.response?.status === 400) {
            const errorMessage = httpError.response.data?.error?.message || 'Invalid request parameters'
            console.error('[MarginTrends] Bad request:', errorMessage)
            throw new Error(`Неверные параметры запроса: ${errorMessage}`)
          }
        }

        // Re-throw for TanStack Query error handling
        throw error
      }
    },
    staleTime: 60000, // 1 minute (trends change more frequently than summary data)
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    // Disable query if parameters are invalid
    enabled: Boolean(weeks || (weekStart && weekEnd)),
  })
}

/**
 * Helper function to generate ISO week range
 * Useful for creating weekStart/weekEnd parameters
 *
 * @param numWeeks - Number of weeks to go back from current week
 * @returns Object with weekStart and weekEnd ISO week strings
 *
 * @example
 * const range = getWeekRange(12) // Last 12 weeks
 * // { weekStart: '2025-W36', weekEnd: '2025-W47' }
 */
export function getWeekRange(numWeeks: number): { weekStart: string; weekEnd: string } {
  const now = new Date()

  // Get current ISO week
  const currentWeekNumber = getISOWeek(now)
  const currentYear = now.getFullYear()
  const endWeek = `${currentYear}-W${currentWeekNumber.toString().padStart(2, '0')}`

  // Calculate start week (numWeeks ago)
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - (numWeeks * 7))
  const startWeekNumber = getISOWeek(startDate)
  const startYear = startDate.getFullYear()
  const startWeek = `${startYear}-W${startWeekNumber.toString().padStart(2, '0')}`

  return { weekStart: startWeek, weekEnd: endWeek }
}

/**
 * Get ISO week number for a date
 * ISO week: Monday-Sunday, week 1 contains first Thursday of the year
 *
 * @param date - Date to get week number for
 * @returns ISO week number (1-53)
 */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7 // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3) // Nearest Thursday
  const firstThursday = new Date(target.getFullYear(), 0, 4) // Jan 4th is always in week 1
  const weekNumber = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + (firstThursday.getDay() + 6) % 7) / 7)
  return weekNumber
}
