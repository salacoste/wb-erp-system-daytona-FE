/**
 * Daily Analytics API Functions
 * Story 61.9-FE: Daily Breakdown Support
 *
 * API functions for fetching daily breakdown data.
 */

import { apiClient } from '../../api-client'
import type { OrdersDailyData, FinanceDailyData, AdvertisingDailyData } from '@/types/daily-metrics'
import type { OrdersVolumeResponse, AdvertisingResponse } from './types'

/**
 * Fetch orders volume with daily breakdown.
 * GET /v1/analytics/orders/volume?from=...&to=...
 * Backend returns dailyTrend: Array<{ date, count }>
 */
export async function getOrdersDailyData(from: string, to: string): Promise<OrdersDailyData[]> {
  const searchParams = new URLSearchParams({ from, to })

  console.info('[Daily Analytics] Fetching orders daily data:', { from, to })

  try {
    const response = await apiClient.get<OrdersVolumeResponse>(
      `/v1/analytics/orders/volume?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    const dailyData: OrdersDailyData[] =
      response.dailyTrend?.map(day => ({
        date: day.date,
        total_amount: 0,
        total_orders: day.count,
      })) ?? []

    console.info('[Daily Analytics] Orders daily data:', {
      days: dailyData.length,
      totalOrders: response.totalOrders,
    })

    return dailyData
  } catch (error) {
    console.error('[Daily Analytics] Failed to fetch orders daily data:', error)
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
 * Fetch all daily data sources in parallel.
 */
export async function getAllDailyData(
  from: string,
  to: string
): Promise<{
  ordersData: OrdersDailyData[]
  financeData: FinanceDailyData[]
  advertisingData: AdvertisingDailyData[]
}> {
  console.info('[Daily Analytics] Fetching all daily data in parallel:', { from, to })

  const [ordersData, financeData, advertisingData] = await Promise.all([
    getOrdersDailyData(from, to),
    getFinanceDailyData(from, to),
    getAdvertisingDailyData(from, to),
  ])

  console.info('[Daily Analytics] All daily data fetched:', {
    ordersDays: ordersData.length,
    financeDays: financeData.length,
    advertisingDays: advertisingData.length,
  })

  return { ordersData, financeData, advertisingData }
}
