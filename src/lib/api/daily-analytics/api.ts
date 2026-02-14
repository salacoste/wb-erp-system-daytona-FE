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
import type { OrdersTrendsResponse, AdvertisingResponse } from './types'

/**
 * Fetch orders trends with daily aggregation.
 * GET /v1/analytics/orders/trends?from=...&to=...&aggregation=day
 * Returns revenue, ordersCount, cancellations, returns per day.
 * Switched from orders/volume (count only) after Request #137 SQL fix.
 */
export async function getOrdersDailyData(from: string, to: string): Promise<OrdersDailyData[]> {
  const searchParams = new URLSearchParams({ from, to, aggregation: 'day' })

  console.info('[Daily Analytics] Fetching orders trends daily data:', { from, to })

  try {
    const response = await apiClient.get<OrdersTrendsResponse>(
      `/v1/analytics/orders/trends?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    const dailyData: OrdersDailyData[] =
      response.trends?.map(day => ({
        date: day.date,
        total_amount: day.revenue,
        total_orders: day.ordersCount,
      })) ?? []

    console.info('[Daily Analytics] Orders trends daily data:', {
      days: dailyData.length,
      totalRevenue: response.summary?.totalRevenue ?? 0,
      totalOrders: response.summary?.totalOrders ?? 0,
    })

    return dailyData
  } catch (error) {
    console.error('[Daily Analytics] Failed to fetch orders trends daily data:', error)
    return []
  }
}

/**
 * Fetch finance daily data.
 * Backend /v1/analytics/weekly/finance-summary accepts only `week` param
 * and does NOT return daily breakdown. Returns empty array.
 * Daily finance breakdown is not supported by the backend yet.
 */
export async function getFinanceDailyData(_from: string, _to: string): Promise<FinanceDailyData[]> {
  // Backend finance-summary endpoint does not support daily breakdown.
  // It only accepts ?week=YYYY-Www and returns aggregate summary_total/summary_rus/summary_eaeu.
  // Return empty array — daily chart will show zeros for finance metrics.
  console.info('[Daily Analytics] Finance daily breakdown not available from backend, skipping')
  return []
}

/**
 * Fetch advertising data with daily breakdown.
 * GET /v1/analytics/advertising?from=...&to=...
 * Backend does not return daily breakdown (no `daily` field).
 */
export async function getAdvertisingDailyData(
  from: string,
  to: string
): Promise<AdvertisingDailyData[]> {
  const searchParams = new URLSearchParams({ from, to })

  console.info('[Daily Analytics] Fetching advertising daily data:', { from, to })

  try {
    const response = await apiClient.get<AdvertisingResponse>(
      `/v1/analytics/advertising?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    // Backend advertising endpoint returns items + summary, no daily breakdown
    const dailyData: AdvertisingDailyData[] =
      response.daily?.map(day => ({
        date: day.date,
        total_spend: day.spend,
      })) ?? []

    console.info('[Daily Analytics] Advertising daily data:', {
      days: dailyData.length,
      totalSpend: response.summary?.totalSpend ?? 0,
    })

    return dailyData
  } catch (error) {
    console.error('[Daily Analytics] Failed to fetch advertising daily data:', error)
    return []
  }
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

  console.info('[Daily Analytics] Fetching orders COGS daily data:', { from, to })

  try {
    const raw = await apiClient.get<Record<string, unknown>>(
      `/v1/analytics/orders/volume?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    const byDay = (raw.by_day_with_cogs as Array<Record<string, unknown>>) ?? []
    const dailyData: OrdersCogsDailyData[] = byDay.map(d => ({
      date: d.date as string,
      cogs: (d.cogs as number) ?? 0,
    }))

    console.info('[Daily Analytics] Orders COGS daily data:', {
      days: dailyData.length,
      totalCogs: raw.cogs_total ?? 0,
    })

    return dailyData
  } catch (error) {
    console.error('[Daily Analytics] Failed to fetch orders COGS daily data:', error)
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
  console.info('[Daily Analytics] Fetching all daily data in parallel:', { from, to })

  const [ordersData, financeData, advertisingData, ordersCogsByDay] = await Promise.all([
    getOrdersDailyData(from, to),
    getFinanceDailyData(from, to),
    getAdvertisingDailyData(from, to),
    getOrdersCogsDailyData(from, to),
  ])

  console.info('[Daily Analytics] All daily data fetched:', {
    ordersDays: ordersData.length,
    financeDays: financeData.length,
    advertisingDays: advertisingData.length,
    ordersCogsDays: ordersCogsByDay.length,
  })

  return { ordersData, financeData, advertisingData, ordersCogsByDay }
}
