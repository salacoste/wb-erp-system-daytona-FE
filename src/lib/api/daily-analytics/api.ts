/**
 * Daily Analytics API Functions
 * Story 61.9-FE: Daily Breakdown Support
 *
 * API functions for fetching daily breakdown data.
 */

import { apiClient } from '../../api-client'
import type {
  OrdersDailyData,
  FinanceDailyData,
  AdvertisingDailyData,
  OrdersCogsDailyData,
} from '@/types/daily-metrics'
import type { OrdersTrendsResponse } from './types'

/**
 * Fetch orders trends with daily aggregation.
 * GET /v1/analytics/orders/trends?from=...&to=...&aggregation=day
 * Returns revenue, ordersCount, cancellations, returns per day.
 * Switched from orders/volume (count only) after Request #137 SQL fix.
 */
export async function getOrdersDailyData(from: string, to: string): Promise<OrdersDailyData[]> {
  const searchParams = new URLSearchParams({ from, to, aggregation: 'day' })

  try {
    const response = await apiClient.get<OrdersTrendsResponse>(
      `/v1/analytics/orders/trends?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    return (
      response.trends?.map(day => ({
        date: day.date,
        total_amount: day.revenue,
        total_orders: day.ordersCount,
      })) ?? []
    )
  } catch {
    return []
  }
}

/**
 * Backend response shape for GET /v1/analytics/daily/finance.
 * Uses camelCase — mapped to FinanceDailyData (snake_case) below.
 */
interface FinanceDailyResponseItem {
  date: string
  revenueGross: number
  revenueNet: number
  returns: number
  cogsTotal: number
  grossProfit: number
  marginPct: number
  logistics: number
  storage: number
  penalties: number
  paidAcceptance: number
  commission: number
  salesCount: number
  returnsCount: number
}

/**
 * Fetch finance daily data.
 * GET /v1/analytics/daily/finance?from=...&to=...
 * Returns per-day sales, COGS, logistics, storage, penalties, commission.
 */
export async function getFinanceDailyData(from: string, to: string): Promise<FinanceDailyData[]> {
  try {
    const response = await apiClient.get<FinanceDailyResponseItem[]>(
      `/v1/analytics/daily/finance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )

    return (response ?? []).map(item => ({
      date: item.date,
      wb_sales_gross: item.revenueGross ?? 0,
      revenue_net: item.revenueNet ?? 0,
      cogs_total: item.cogsTotal ?? 0,
      logistics_cost: item.logistics ?? 0,
      storage_cost: item.storage ?? 0,
      penalties: item.penalties ?? 0,
      paid_acceptance: item.paidAcceptance ?? 0,
      commission: item.commission ?? 0,
      returns: item.returns ?? 0,
      returns_count: item.returnsCount ?? 0,
      sales_count: item.salesCount ?? 0,
    }))
  } catch {
    return []
  }
}

/**
 * Backend response shape for GET /v1/analytics/daily/advertising.
 */
interface AdvertisingDailyResponseItem {
  date: string
  spend: number
  views: number
  clicks: number
  ctr: number
  cpc: number
  orders: number
  revenue: number
  roas: number
}

/**
 * Fetch advertising daily data.
 * GET /v1/analytics/daily/advertising?from=...&to=...
 * Returns per-day spend, views, clicks, orders, revenue.
 */
export async function getAdvertisingDailyData(
  from: string,
  to: string
): Promise<AdvertisingDailyData[]> {
  try {
    const response = await apiClient.get<AdvertisingDailyResponseItem[]>(
      `/v1/analytics/daily/advertising?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )

    return (response ?? []).map(item => ({
      date: item.date,
      total_spend: item.spend ?? 0,
    }))
  } catch {
    return []
  }
}

/**
 * Backend response shape for GET /v1/analytics/orders/volume?include_cogs=true.
 */
interface OrdersVolumeWithCogsResponse {
  cogs_total?: number
  by_day_with_cogs?: Array<{ date: string; cogs: number }>
}

/**
 * Fetch per-day COGS from orders/volume?include_cogs=true.
 * Extracts by_day_with_cogs from the response (Request #138 fix).
 */
export async function getOrdersCogsDailyData(
  from: string,
  to: string
): Promise<OrdersCogsDailyData[]> {
  const searchParams = new URLSearchParams({ from, to, include_cogs: 'true' })

  try {
    const raw = await apiClient.get<OrdersVolumeWithCogsResponse>(
      `/v1/analytics/orders/volume?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    return (raw.by_day_with_cogs ?? []).map(d => ({
      date: d.date,
      cogs: d.cogs ?? 0,
    }))
  } catch {
    return []
  }
}

/**
 * Fetch all daily data sources in parallel.
 */
export async function getAllDailyData(
  from: string,
  to: string
): Promise<{
  ordersData: OrdersDailyData[]
  financeData: FinanceDailyData[]
  advertisingData: AdvertisingDailyData[]
  ordersCogsByDay: OrdersCogsDailyData[]
}> {
  const [ordersData, financeData, advertisingData, ordersCogsByDay] = await Promise.all([
    getOrdersDailyData(from, to),
    getFinanceDailyData(from, to),
    getAdvertisingDailyData(from, to),
    getOrdersCogsDailyData(from, to),
  ])

  return { ordersData, financeData, advertisingData, ordersCogsByDay }
}
