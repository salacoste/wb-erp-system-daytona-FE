/**
 * Daily Analytics API Functions
 * Story 61.9-FE: Daily Breakdown Support
 *
 * API functions for fetching daily breakdown data.
 */

import { apiClient } from '../../api-client'
import type { OrdersDailyData, FinanceDailyData, AdvertisingDailyData } from '@/types/daily-metrics'
import type { OrdersVolumeResponse, FinanceSummaryResponse, AdvertisingResponse } from './types'

/**
 * Fetch orders volume with daily breakdown.
 * GET /v1/analytics/orders/volume?aggregation=day
 */
export async function getOrdersDailyData(from: string, to: string): Promise<OrdersDailyData[]> {
  const searchParams = new URLSearchParams({
    from,
    to,
    aggregation: 'day',
  })

  console.info('[Daily Analytics] Fetching orders daily data:', { from, to })

  try {
    const response = await apiClient.get<OrdersVolumeResponse>(
      `/v1/analytics/orders/volume?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    const dailyData: OrdersDailyData[] =
      response.by_day?.map(day => ({
        date: day.date,
        total_amount: day.amount,
        total_orders: day.orders,
      })) ?? []

    console.info('[Daily Analytics] Orders daily data:', {
      days: dailyData.length,
      totalAmount: response.total_amount,
    })

    return dailyData
  } catch (error) {
    console.error('[Daily Analytics] Failed to fetch orders daily data:', error)
    return []
  }
}

/**
 * Fetch finance summary with daily breakdown.
 * GET /v1/analytics/weekly/finance-summary?aggregation=day
 */
export async function getFinanceDailyData(from: string, to: string): Promise<FinanceDailyData[]> {
  const searchParams = new URLSearchParams({
    from,
    to,
    aggregation: 'day',
  })

  console.info('[Daily Analytics] Fetching finance daily data:', { from, to })

  try {
    const response = await apiClient.get<FinanceSummaryResponse>(
      `/v1/analytics/weekly/finance-summary?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    const dailyData: FinanceDailyData[] =
      response.daily?.map(day => ({
        date: day.date,
        wb_sales_gross: day.wb_sales_gross,
        cogs_total: day.cogs_total,
        logistics_cost: day.logistics_cost,
        storage_cost: day.storage_cost,
      })) ?? []

    console.info('[Daily Analytics] Finance daily data:', {
      days: dailyData.length,
    })

    return dailyData
  } catch (error) {
    console.error('[Daily Analytics] Failed to fetch finance daily data:', error)
    return []
  }
}

/**
 * Fetch advertising data with daily breakdown.
 * GET /v1/analytics/advertising?aggregation=day
 */
export async function getAdvertisingDailyData(
  from: string,
  to: string
): Promise<AdvertisingDailyData[]> {
  const searchParams = new URLSearchParams({
    from,
    to,
    aggregation: 'day',
  })

  console.info('[Daily Analytics] Fetching advertising daily data:', { from, to })

  try {
    const response = await apiClient.get<AdvertisingResponse>(
      `/v1/analytics/advertising?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

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
