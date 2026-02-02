/**
 * Hook for fetching trend data over multiple weeks
 * Story 3.4: Trend Graphs for Key Metrics
 * Story 3.4a: Trends API Optimization - Uses single endpoint instead of N requests
 *
 * OPTIMIZATION (Story 3.4a):
 * Before: N+1 requests (available-weeks + N finance-summary calls)
 * After: 1 request (GET /v1/analytics/weekly/trends)
 * Performance: ~50-70% faster
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { WeeklyTrendsResponse } from '@/types/api'

export interface TrendDataPoint {
  week: string
  date: string // Formatted date for display (uses week as fallback)
  revenue: number
  totalPayable: number
  /** Logistics cost for the week (Doc 122/123: logistics_cost metric) */
  logisticsCost: number
}

export interface TrendData {
  trends: TrendDataPoint[]
  period: 'weeks' | 'months'
  /** Summary statistics from new API (Story 6.6) */
  summary?: WeeklyTrendsResponse['summary']
}

/**
 * Calculate ISO week range from current date
 * @param numWeeks - Number of weeks to go back
 * @returns Object with from and to ISO week strings
 */
function getWeekRange(numWeeks: number): { from: string; to: string } {
  const now = new Date()

  // Get current ISO week
  const currentWeek = getISOWeekString(now)

  // Calculate start week (numWeeks ago)
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - numWeeks * 7)
  const startWeek = getISOWeekString(startDate)

  return { from: startWeek, to: currentWeek }
}

/**
 * Get ISO week string for a date (YYYY-Www format)
 */
function getISOWeekString(date: Date): string {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7 // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3) // Nearest Thursday
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const weekNumber =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7
    )
  return `${target.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Hook to get trend data for key metrics over time
 * Uses optimized single-request endpoint (Story 6.6)
 *
 * @param limit - Number of weeks to fetch (default: 8)
 * @returns TanStack Query result with trend data
 */
export function useTrends(limit = 8) {
  const { from, to } = getWeekRange(limit)

  return useQuery({
    queryKey: ['dashboard', 'trends', limit, from, to],
    queryFn: async (): Promise<TrendData> => {
      try {
        // Story 3.4a: Single optimized request instead of N+1 requests
        // Story 61.1: Use wb_sales_gross (seller revenue after WB commission), NOT sale_gross (retail price)
        // Difference: sale_gross includes WB's ~33% commission, wb_sales_gross is actual seller earnings
        // Doc 122/123: Added logistics_cost for expense tracking
        const endpoint = `/v1/analytics/weekly/trends?from=${from}&to=${to}&metrics=wb_sales_gross,to_pay_goods,logistics_cost`
        console.info(`[Trends] Fetching trends (optimized): ${endpoint}`)

        const response = await apiClient.get<WeeklyTrendsResponse>(endpoint)

        // Handle empty data
        if (!response.data || response.data.length === 0) {
          console.info('[Trends] No data available for requested period')
          return { trends: [], period: 'weeks', summary: response.summary }
        }

        // Map API response to TrendDataPoint format for backward compatibility
        // TrendGraph component expects: { week, date, revenue, totalPayable, logisticsCost }
        // Story 61.1: Use wb_sales_gross (seller revenue) instead of sale_gross (retail price)
        // Doc 122/123: Include logistics_cost for expense tracking
        const trends: TrendDataPoint[] = response.data
          .map(point => ({
            week: point.week,
            date: point.week, // Use week as date (component formats it anyway)
            revenue: point.wb_sales_gross ?? 0,
            totalPayable: point.to_pay_goods ?? 0,
            logisticsCost: point.logistics_cost ?? 0,
          }))
          .sort((a, b) => a.week.localeCompare(b.week)) // Ascending order

        console.info(`[Trends] Received ${trends.length} data points in single request`)

        return {
          trends,
          period: 'weeks',
          summary: response.summary,
        }
      } catch (error) {
        console.error('[Trends] Failed to fetch trend data:', error)

        // Handle specific error cases
        if (error instanceof Error && 'response' in error) {
          const httpError = error as { response?: { status?: number; data?: { message?: string } } }

          if (httpError.response?.status === 404) {
            console.warn('[Trends] No data available for requested time range')
            return { trends: [], period: 'weeks' }
          }

          if (httpError.response?.status === 400) {
            const errorMessage = httpError.response.data?.message || 'Invalid request parameters'
            console.error('[Trends] Bad request:', errorMessage)
            // Return empty instead of throwing to avoid breaking dashboard
            return { trends: [], period: 'weeks' }
          }
        }

        // Return empty data on error to avoid breaking dashboard
        return { trends: [], period: 'weeks' }
      }
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
