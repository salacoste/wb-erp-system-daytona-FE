/**
 * Daily Analytics API Types
 * Story 61.9-FE: Daily Breakdown Support
 *
 * Backend response interfaces.
 */

/**
 * Backend response for orders volume with daily aggregation.
 */
export interface OrdersVolumeResponse {
  total_orders: number
  total_amount: number
  avg_order_value: number
  by_status: {
    new: number
    confirm: number
    complete: number
    cancel: number
  }
  by_day?: Array<{
    date: string
    orders: number
    amount: number
  }>
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
