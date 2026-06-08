/**
 * Types for buyout daily trend data.
 * Endpoint: GET /v1/analytics/buyout/daily?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

export interface DailyBuyoutPoint {
  date: string
  buyoutRate: number | null
  returnRate: number | null
  ordersCount: number
  returnsCount: number
}

export interface DailyBuyoutSummary {
  avgBuyoutRate: number | null
  avgReturnRate: number | null
  totalOrders: number
  totalReturns: number
}

export interface BuyoutDailyResponse {
  daily: DailyBuyoutPoint[]
  period: { from: string; to: string }
  summary: DailyBuyoutSummary
}
