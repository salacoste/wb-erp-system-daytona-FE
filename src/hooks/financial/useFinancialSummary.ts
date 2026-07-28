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
import { aggregateFinanceSummaries } from './aggregation'
import type { FinanceSummaryResponse, WeekData } from './types'
import type { FinanceSummary } from '../useDashboard'

type BackendMonthlyFinanceSummary = FinanceSummary & {
  product_transactions_total?: number | null
}

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

  // The backend owns month aggregation and skips missing weeks safely. Using its month endpoint
  // avoids N client requests (plus another N for comparison) and keeps aggregation rules aligned
  // across consumers.
  return useQuery({
    queryKey: ['financial', 'summary', period, 'month'],
    queryFn: async (): Promise<FinanceSummaryResponse> => {
      const response = await apiClient.get<FinanceSummaryResponse>(
        `/v1/analytics/weekly/finance-summary?month=${period}`
      )
      if (!response.summary_total) return response

      const backendSummary = response.summary_total as BackendMonthlyFinanceSummary
      const processedSummary = aggregateFinanceSummaries([backendSummary]) ?? backendSummary
      const productTransactions =
        backendSummary.product_transactions ?? backendSummary.product_transactions_total

      return {
        ...response,
        summary_total: {
          ...processedSummary,
          ...(productTransactions != null ? { product_transactions: productTransactions } : {}),
        },
      }
    },
    enabled: !!period,
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
