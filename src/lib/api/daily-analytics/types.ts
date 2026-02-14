/**
 * Daily Analytics API Types
 * Story 61.9-FE: Daily Breakdown Support
 *
 * Backend response interfaces.
 */

/**
 * Backend response for orders volume.
 * GET /v1/analytics/orders/volume?from=...&to=...
 */
export interface OrdersVolumeResponse {
  totalOrders: number
  cancellationRate: number
  b2bPercentage: number
  statusBreakdown: Record<string, number>
  dailyTrend?: Array<{
    date: string
    count: number
  }>
  hourlyTrend?: Array<{
    hour: number
    count: number
  }>
  peakHours?: number[]
  period: { from: string; to: string }
  cachedAt?: string
}

/**
 * Backend response for orders trends with daily aggregation.
 * GET /v1/analytics/orders/trends?from=...&to=...&aggregation=day
 * Provides revenue, cancellations, returns per day (Request #137 fix).
 */
export interface OrdersTrendsResponse {
  trends: Array<{
    date: string
    ordersCount: number
    revenue: number
    cancellations: number
    cancellationRate: number
    returns: number
    returnRate: number
    avgOrderValue: number
  }>
  summary: {
    totalOrders: number
    totalRevenue: number
    avgDailyOrders: number
    cancellationRate: number
    returnRate: number
  }
  dataSource: {
    primary: string
  }
  period: {
    from: string
    to: string
    aggregation: string
    daysIncluded: number
  }
}

/**
 * Backend response for finance summary with daily breakdown.
 */
export interface FinanceSummaryResponse {
  summary: {
    total_revenue: number
    total_cogs: number
    total_logistics: number
    total_storage: number
  }
  daily?: Array<{
    date: string
    wb_sales_gross: number
    cogs_total: number
    logistics_cost: number
    storage_cost: number
  }>
}

/**
 * Backend response for advertising analytics.
 */
export interface AdvertisingResponse {
  summary: {
    totalSpend: number
    totalRevenue: number
  }
  daily?: Array<{
    date: string
    spend: number
  }>
}
