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
  // Story 88.2-FE: backend sends null when no COGS assigned for this day
  cogsTotal: number | null
  grossProfit: number | null
  marginPct: number | null
  logistics: number
  storage: number
  penalties: number
  paidAcceptance: number
  commission: number
  salesCount: number
  returnsCount: number
  // Story 91.2-FE: Backend Epics 89-93 additions
  // operatingProfit also sent by backend but not consumed — netProfit is the post-ads metric we use
  advertisingSpend: number // ad spend from adv_daily_stats (0 if no ads)
  netProfit: number | null // operatingProfit - advertisingSpend (null when COGS unknown)
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
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: wb_sales_gross 0 = partial day with no sales
      wb_sales_gross: item.revenueGross ?? 0,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: revenue_net 0 = partial day with no sales
      revenue_net: item.revenueNet ?? 0,
      // Story 88.2-FE: preserve null — "unknown COGS" and "zero COGS" are distinct states
      cogs_total: item.cogsTotal ?? null,
      logistics_cost: item.logistics ?? 0,
      storage_cost: item.storage ?? 0,
      penalties: item.penalties ?? 0,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: paid_acceptance 0 = no acceptance that day
      paid_acceptance: item.paidAcceptance ?? 0,
      commission: item.commission ?? 0,
      returns: item.returns ?? 0,
      returns_count: item.returnsCount ?? 0,
      sales_count: item.salesCount ?? 0,
      // Story 91.2-FE: new fields from backend Epics 89-93
      advertising_spend: item.advertisingSpend ?? 0, // 0 = no ads (legitimate zero)
      net_profit: item.netProfit ?? null, // null-preserving per CLAUDE.md anti-pattern #8
    }))
  } catch {
    return []
  }
}

/**
 * Backend response shape for GET /v1/analytics/daily/advertising.
 * Money/ratio fields are nullable — backend may omit them for days with no ad data.
 */
interface AdvertisingDailyResponseItem {
  date: string
  spend: number | null | undefined
  views: number | null | undefined
  clicks: number | null | undefined
  ctr: number | null | undefined
  cpc: number | null | undefined
  orders: number | null | undefined
  revenue: number | null | undefined
  roas: number | null | undefined
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
    const response = await apiClient.get<AdvertisingDailyResponseItem[]>(
      `/v1/analytics/daily/advertising?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )

    return (response ?? []).map(item => ({
      date: item.date,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: total_spend 0 = no advertising spend that day
      total_spend: item.spend ?? 0,
      views: item.views ?? 0, // count
      clicks: item.clicks ?? 0, // count
      ctr: item.ctr ?? null, // ratio — preserve null per Anti-Pattern #8
      cpc: item.cpc ?? null, // money — preserve null
      orders: item.orders ?? 0, // count
      revenue: item.revenue ?? null, // money — preserve null
      roas: item.roas ?? null, // ratio — preserve null
    }))
  } catch {
    return []
  }
}

/**
 * Backend response shape for GET /v1/analytics/orders/volume?include_cogs=true.
 */
interface OrdersVolumeWithCogsResponse {
  cogs_total?: number | null
  // Story 88.2-FE: backend sends null when no COGS assigned for SKUs ordered on this day
  by_day_with_cogs?: Array<{ date: string; cogs: number | null }>
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
      // Story 88.2-FE: preserve null — COGS not assigned ≠ zero cost
      cogs: d.cogs ?? null,
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
