/**
 * Financial Summary Hooks - Barrel Export
 * Story 3.5: Financial Summary View
 */

// Types
export type { FinanceSummaryResponse, WeekData, ChangeResult } from './types'

// Aggregation
export { aggregateFinanceSummaries } from './aggregation'

// Helpers
export {
  getCurrentIsoWeek,
  formatWeekDisplay,
  formatWeekWithDateRange,
  calculateChange,
} from './helpers'

// Hooks
export {
  useFinancialSummary,
  useFinancialSummaryComparison,
  useFinancialSummaryWithPeriodComparison,
  useAvailableWeeks,
  useMultiWeekFinancialSummary,
  type UseFinancialSummaryComparisonOptions,
} from './hooks'
