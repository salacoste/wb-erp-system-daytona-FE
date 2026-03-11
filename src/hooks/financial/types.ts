/**
 * Financial Summary Types
 * Story 3.5: Financial Summary View
 *
 * TypeScript interfaces for financial summary hooks.
 */

import type { FinanceSummary } from '../useDashboard'

/**
 * Response from finance-summary endpoint
 */
export interface FinanceSummaryResponse {
  summary_total: FinanceSummary | null
  summary_rus: FinanceSummary | null
  summary_eaeu: FinanceSummary | null
  meta: {
    week: string
    cabinet_id: string
    generated_at: string
    timezone: string
  }
}

/**
 * Available week data
 */
export interface WeekData {
  week: string
  start_date: string
}

/**
 * Change calculation result
 */
export interface ChangeResult {
  value: number | null
  percentage: number | null
  trend: 'up' | 'down' | 'same'
}
