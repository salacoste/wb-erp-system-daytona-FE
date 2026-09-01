'use client'

/**
 * Per-Week Financial Summary Series
 *
 * Unlike `useMultiWeekFinancialSummary` (which aggregates N weeks into ONE total),
 * this hook keeps each week separate so the finance-history table can render a
 * metric × week grid. Used by `/analytics/finance-history`.
 *
 * Each week's summary gets the same single-week margin-consistency pass that
 * `useFinancialSummary` applies (`aggregateFinanceSummaries([summary])`) so the
 * margin/ratio fields read identically to the dashboard's current-week numbers.
 */

import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { aggregateFinanceSummaries } from './aggregation'
import type { FinanceSummaryResponse } from './types'
import type { FinanceSummary } from '../useDashboard'

export interface WeeklyFinancialPoint {
  week: string
  summary: FinanceSummary | null
}

export interface UseWeeklyFinancialSeriesResult {
  data: WeeklyFinancialPoint[]
  isLoading: boolean
  isError: boolean
  error: unknown
  /** True only once every requested week has resolved (data or error). */
  isSettled: boolean
  refetch: () => void
}

export function useWeeklyFinancialSeries(weeks: readonly string[]): UseWeeklyFinancialSeriesResult {
  const queries = useQueries({
    queries: weeks.map(week => ({
      queryKey: ['financial', 'summary', week, 'week'] as const,
      queryFn: async (): Promise<FinanceSummaryResponse> => {
        const response = await apiClient.get<FinanceSummaryResponse>(
          `/v1/analytics/weekly/finance-summary?week=${week}`
        )
        // Single-week margin-consistency pass (mirrors useFinancialSummary).
        const raw = response.summary_total || response.summary_rus
        if (raw) {
          const processed = aggregateFinanceSummaries([raw])
          if (processed) {
            const ptRus = response.summary_rus?.product_transactions
            const ptEaeu = response.summary_eaeu?.product_transactions
            if (ptRus != null || ptEaeu != null) {
              processed.product_transactions = (ptRus ?? 0) + (ptEaeu ?? 0)
            }
            return {
              ...response,
              summary_total: processed,
              summary_rus: response.summary_rus ? processed : null,
            }
          }
        }
        return response
      },
      enabled: !!week,
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    })),
  })

  const isLoading = queries.some(q => q.isLoading)
  const isError = queries.some(q => q.isError)
  const error = queries.find(q => q.error)?.error ?? null
  const isSettled = queries.length > 0 && queries.every(q => !q.isLoading)

  const data: WeeklyFinancialPoint[] = weeks.map((week, i) => ({
    week,
    summary: queries[i].data?.summary_total || queries[i].data?.summary_rus || null,
  }))

  return {
    data,
    isLoading,
    isError,
    error,
    isSettled,
    refetch: () => {
      for (const query of queries) void query.refetch()
    },
  }
}
