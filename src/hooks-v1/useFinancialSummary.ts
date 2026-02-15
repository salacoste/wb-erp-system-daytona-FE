/**
 * Hooks for financial summary data fetching
 * Story 3.5: Financial Summary View
 *
 * COMPATIBILITY LAYER - Re-exports from modular structure
 *
 * This file maintains backward compatibility for existing imports.
 * New code should import directly from '@/hooks/financial'.
 */

// Re-export everything from the modular structure
export {
  // Types
  type FinanceSummaryResponse,
  type WeekData,
  type UseFinancialSummaryComparisonOptions,
  // Aggregation
  aggregateFinanceSummaries,
  // Helpers
  getCurrentIsoWeek,
  formatWeekDisplay,
  formatWeekWithDateRange,
  calculateChange,
  // Hooks
  useFinancialSummary,
  useFinancialSummaryComparison,
  useFinancialSummaryWithPeriodComparison,
  useAvailableWeeks,
  useMultiWeekFinancialSummary,
} from './financial'
