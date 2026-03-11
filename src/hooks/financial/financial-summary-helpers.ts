/**
 * Financial Summary Helper Functions
 * Story 61.11-FE: Previous Period Data Integration
 *
 * Date period helpers for financial summary comparison hooks.
 * Extracted from hooks.ts for file size compliance (Epic 74).
 */

import {
  getPreviousWeek as getPreviousWeekString,
  getPreviousMonth as getPreviousMonthString,
} from '@/lib/period-helpers'

/**
 * Options for useFinancialSummaryWithPeriodComparison hook
 * Story 61.11-FE: Previous Period Data Integration
 */
export interface UseFinancialSummaryComparisonOptions {
  /** Period type: 'week' or 'month' */
  periodType: 'week' | 'month'
  /** ISO week (YYYY-Www) or month (YYYY-MM) */
  period: string
  /** Enable/disable query */
  enabled?: boolean
}

// Re-export date helpers for backward compatibility (DRY — @/lib/period-helpers is authoritative)
export { getPreviousWeekString, getPreviousMonthString }
