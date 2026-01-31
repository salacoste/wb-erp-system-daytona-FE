/**
 * Analytics Comparison Types
 * Story 61.5-FE: Comparison Endpoint Integration
 */

import type {
  ComparisonParams,
  DashboardMetricsComparison,
  ExpenseMetricsComparison,
  ComparisonResponse,
} from '@/types/analytics-comparison'

export interface UseComparisonOptions extends ComparisonParams {
  /** Enable/disable the query */
  enabled?: boolean
}

export interface UseDashboardComparisonResult {
  /** Dashboard metrics with comparison data */
  metrics: DashboardMetricsComparison | null
  /** Expense metrics with comparison data */
  expenses: ExpenseMetricsComparison | null
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Raw API response */
  raw: ComparisonResponse | undefined
}
