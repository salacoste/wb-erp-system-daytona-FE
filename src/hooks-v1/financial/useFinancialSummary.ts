'use client'

/**
 * Financial Summary Hook - Single week/month
 * Story 3.5: Financial Summary View
 *
 * Supports both week format (YYYY-Www) and month format (YYYY-MM).
 * For months, aggregates data from all weeks in that month.
 *
 * Story 61.13-FE: Margin Calculation Consistency
 * Both week and month periods use the same Gross Margin formula:
 * margin_pct = (sale_gross_total - cogs_total) / sale_gross_total * 100
 *
 * Extracted from hooks.ts for file size compliance (Epic 74).
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { getWeeksInMonth } from '@/lib/period-helpers'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { aggregateFinanceSummaries } from './aggregation'
import type { FinanceSummaryResponse, WeekData } from './types'
import type { FinanceSummary } from '../useDashboard'

/**
 * Hook to get financial summary for a specific week or month
 */
export function useFinancialSummary(period: string, periodType: 'week' | 'month' = 'week') {
  // For week periods, use the existing single-week query
  if (periodType === 'week') {
    return useQuery({
      queryKey: ['financial', 'summary', period, 'week'],
      queryFn: async (): Promise<FinanceSummaryResponse> => {
        const response = await apiClient.get<FinanceSummaryResponse>(
          `/v1/analytics/weekly/finance-summary?week=${period}`
        )

        // Story 61.13-FE: Apply margin calculation to single week response
        // Use aggregateFinanceSummaries to ensure consistent margin_pct calculation
        const summary = response.summary_total || response.summary_rus
        if (summary) {
          const processedSummary = aggregateFinanceSummaries([summary])
          // Preserve product_transactions from original summaries (sum of rus + eaeu)
          // summary_total doesn't include this field, so we merge from originals
          if (processedSummary) {
            const ptRus = response.summary_rus?.product_transactions
            const ptEaeu = response.summary_eaeu?.product_transactions
            if (ptRus != null || ptEaeu != null) {
              processedSummary.product_transactions = (ptRus ?? 0) + (ptEaeu ?? 0)
            }
          }
          return {
            ...response,
            summary_total: processedSummary,
            summary_rus: response.summary_rus ? processedSummary : null,
          }
        }

        return response
      },
      enabled: !!period,
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData,
    })
  }

  // For month periods, use multi-week aggregation
  // BUG FIX: Filter out weeks after last completed week
  const allWeeksInMonth = getWeeksInMonth(period)
  const lastCompletedWeek = getLastCompletedWeek()
  const weeksInMonth = allWeeksInMonth.filter(week => week <= lastCompletedWeek)

  return useQuery({
    queryKey: ['financial', 'summary', period, 'month', weeksInMonth],
    queryFn: async (): Promise<FinanceSummaryResponse> => {
      // Fetch all weeks in parallel
      const weekPromises = weeksInMonth.map((week: string) =>
        apiClient.get<FinanceSummaryResponse>(`/v1/analytics/weekly/finance-summary?week=${week}`)
      )

      const responses = await Promise.all(weekPromises)

      // Aggregate all summaries
      const summaries = responses
        .map(r => r.summary_total || r.summary_rus)
        .filter(Boolean) as FinanceSummary[]

      const aggregatedSummary = aggregateFinanceSummaries(summaries)

      // Sum product_transactions across all weeks from original summaries
      if (aggregatedSummary) {
        let totalPt = 0
        let hasPt = false
        for (const r of responses) {
          const ptR = r.summary_rus?.product_transactions
          const ptE = r.summary_eaeu?.product_transactions
          if (ptR != null || ptE != null) {
            totalPt += (ptR ?? 0) + (ptE ?? 0)
            hasPt = true
          }
        }
        if (hasPt) aggregatedSummary.product_transactions = totalPt
      }

      return {
        summary_total: aggregatedSummary,
        summary_rus: aggregatedSummary,
        summary_eaeu: null,
        meta: {
          week: weeksInMonth.join(', '),
          cabinet_id: responses[0]?.meta?.cabinet_id || '',
          generated_at: new Date().toISOString(),
          timezone: 'Europe/Moscow',
        },
      }
    },
    enabled: !!period && weeksInMonth.length > 0,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to get list of available weeks
 */
export function useAvailableWeeks() {
  return useQuery({
    queryKey: ['financial', 'available-weeks'],
    queryFn: async (): Promise<WeekData[]> => {
      const response = await apiClient.get<Array<WeekData> | { data: Array<WeekData> }>(
        '/v1/analytics/weekly/available-weeks'
      )

      // Handle both array and object formats
      const weeksArray = Array.isArray(response) ? response : response?.data || []

      return weeksArray
    },
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
  })
}
