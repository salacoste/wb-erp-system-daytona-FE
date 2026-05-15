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
  revenue: number // wb_sales_gross (fallback: sale_gross) — выручка продавца
  totalPayable: number // to_pay_goods — к перечислению за товар
  payoutTotal: number // payout_total — фактически перечислено продавцу
  logisticsCost: number // logistics_cost — логистика
  cogsTotal: number // cogs_total — себестоимость из finance-summary
  /** Операционная прибыль: payout_total - cogs_total */
  operatingProfit: number | null
  /** Эффективность бизнеса: (payout - cogs) / wb_sales_gross * 100 */
  efficiencyPct: number | null
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
        // Metrics: wb_sales_gross (выручка продавца), sale_gross (fallback),
        //   to_pay_goods, payout_total, logistics_cost
        const endpoint = `/v1/analytics/weekly/trends?from=${from}&to=${to}&metrics=wb_sales_gross,sale_gross,to_pay_goods,payout_total,logistics_cost`
        console.info(`[Trends] Fetching trends (optimized): ${endpoint}`)

        const response = await apiClient.get<WeeklyTrendsResponse>(endpoint, {
          skipDataUnwrap: true,
        })

        // Handle empty data
        if (!response.data || response.data.length === 0) {
          console.info('[Trends] No data available for requested period')
          return { trends: [], period: 'weeks', summary: response.summary }
        }

        // Fetch cogs_total per week from finance-summary (parallel)
        const weeks = response.data.map(p => p.week)
        const cogsMap = new Map<string, number>()
        const cogsResults = await Promise.allSettled(
          weeks.map(async week => {
            type FsSummary = {
              summary_total?: { cogs_total?: number }
              data?: { summary_total?: { cogs_total?: number } }
            }
            const fs = await apiClient.get<FsSummary>(
              `/v1/analytics/weekly/finance-summary?week=${week}`,
              { skipDataUnwrap: true }
            )
            const cogs = fs.data?.summary_total?.cogs_total ?? fs.summary_total?.cogs_total
            if (cogs != null) cogsMap.set(week, cogs)
          })
        )
        // Log failures but don't block
        cogsResults.forEach((r, i) => {
          if (r.status === 'rejected') console.warn(`[Trends] COGS fetch failed for ${weeks[i]}`)
        })

        const trends: TrendDataPoint[] = response.data
          .map(point => {
            const revenue = point.wb_sales_gross ?? point.sale_gross ?? 0
            const payout = point.payout_total ?? 0
            const cogs = cogsMap.get(point.week) ?? 0
            const opProfit = payout > 0 ? payout - cogs : null
            return {
              week: point.week,
              revenue,
              // eslint-disable-next-line no-restricted-syntax -- AGGREGATION-REDUCE: to_pay_goods null = absent week treated as 0 in trends normalizer
              totalPayable: point.to_pay_goods ?? 0,
              payoutTotal: payout,
              // eslint-disable-next-line no-restricted-syntax -- AGGREGATION-REDUCE: logistics_cost null = absent week treated as 0 in trends normalizer
              logisticsCost: point.logistics_cost ?? 0,
              cogsTotal: cogs,
              operatingProfit: opProfit,
              efficiencyPct:
                revenue > 0 && opProfit != null
                  ? Math.round((opProfit / revenue) * 1000) / 10
                  : null,
            }
          })
          .sort((a, b) => a.week.localeCompare(b.week))

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
