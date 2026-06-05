/**
 * Daily Analytics API Functions
 * Story 61.9-FE: Daily Breakdown Support
 *
 * API functions for fetching daily breakdown data.
 */

import { apiClient } from '../../api-client'
import {
  normalizeOrdersTrendsResponse,
  normalizeFinanceDailyResponse,
  normalizeAdvertisingDailyResponse,
  normalizeOrdersCogsResponse,
} from './daily-analytics-normalizer'
import type {
  OrdersDailyData,
  FinanceDailyData,
  AdvertisingDailyData,
  OrdersCogsDailyData,
} from '@/types/daily-metrics'

/**
 * Fetch orders trends with daily aggregation.
 * GET /v1/analytics/orders/trends?from=...&to=...&aggregation=day
 * Returns revenue, ordersCount, cancellations, returns per day.
 * Switched from orders/volume (count only) after Request #137 SQL fix.
 */
export async function getOrdersDailyData(from: string, to: string): Promise<OrdersDailyData[]> {
  const searchParams = new URLSearchParams({ from, to, aggregation: 'day' })

  try {
    const raw = await apiClient.get<unknown>(
      `/v1/analytics/orders/trends?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    return normalizeOrdersTrendsResponse(raw)
  } catch {
    return []
  }
}

/**
 * Fetch finance daily data.
 * GET /v1/analytics/daily/finance?from=...&to=...
 * Returns per-day sales, COGS, logistics, storage, penalties, commission.
 */
export async function getFinanceDailyData(from: string, to: string): Promise<FinanceDailyData[]> {
  try {
    const raw = await apiClient.get<unknown>(
      `/v1/analytics/daily/finance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )

    return normalizeFinanceDailyResponse(raw)
  } catch {
    return []
  }
}

/**
 * Fetch advertising daily data.
 * GET /v1/analytics/daily/advertising?from=...&to=...
 * Returns per-day `spend`, `views`, `clicks`, `ctr`, `cpc`, `orders`, `revenue`, `roas`
 * (ratios/money fields preserve null per Anti-Pattern #8).
 */
export async function getAdvertisingDailyData(
  from: string,
  to: string
): Promise<AdvertisingDailyData[]> {
  try {
    const raw = await apiClient.get<unknown>(
      `/v1/analytics/daily/advertising?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )

    return normalizeAdvertisingDailyResponse(raw)
  } catch {
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

  try {
    const raw = await apiClient.get<unknown>(
      `/v1/analytics/orders/volume?${searchParams.toString()}`,
      { skipDataUnwrap: true }
    )

    return normalizeOrdersCogsResponse(raw)
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
