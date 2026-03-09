'use client'

/**
 * Financial Summary Comparison Hook
 * Story 3.5: Financial Summary View
 *
 * Two-week comparison hook for financial summaries.
 * Extracted from hooks.ts for file size compliance (Epic 74).
 */

import { useFinancialSummary } from './useFinancialSummary'

/**
 * Hook to get financial summary for two weeks (for comparison)
 */
export function useFinancialSummaryComparison(week1: string, week2: string) {
  const query1 = useFinancialSummary(week1)
  const query2 = useFinancialSummary(week2)

  return {
    week1: query1,
    week2: query2,
    isLoading: query1.isLoading || query2.isLoading,
    isError: query1.isError || query2.isError,
    error: query1.error || query2.error,
  }
}
