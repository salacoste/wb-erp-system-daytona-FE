/**
 * Types for Returns Daily Trend endpoint
 * GET /v1/analytics/returns/daily?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Response: daily return counts by category with return rate.
 */

export interface DailyReturnItem {
  date: string
  totalReturns: number
  returnRate: number
  cancellations: number
  refusals: number
  defects: number
}

export interface ReturnsDailySummary {
  totalReturns: number
  avgReturnRate: number
  totalCancellations: number
  totalRefusals: number
  totalDefects: number
}

export interface ReturnsDailyResponse {
  daily: DailyReturnItem[]
  period: { from: string; to: string }
  summary: ReturnsDailySummary
}
