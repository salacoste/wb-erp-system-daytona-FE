/**
 * Shared types for Financial Summary Table components
 */

import type { FinanceSummary } from '@/hooks/useDashboard'

export interface FinancialSummaryTableProps {
  /**
   * Primary week summary data
   */
  summary: FinanceSummary

  /**
   * Comparison week summary data (optional)
   */
  comparisonSummary?: FinanceSummary

  /**
   * Custom class name
   */
  className?: string
}

export interface MetricRowProps {
  label: string
  value?: number | null
  comparisonValue?: number | null
  highlight?: boolean
  isNegative?: boolean
  isComparison: boolean
}

export interface ExpenseRowProps {
  label: string
  value: number
  compValue: number
  base: number
  compBase: number
  indent?: number
  bold?: boolean
  highlight?: boolean
  isComparison: boolean
}
