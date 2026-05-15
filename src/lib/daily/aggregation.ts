/**
 * Daily Metrics Aggregation
 * Story 61.9-FE: Daily Breakdown Support
 *
 * Functions for aggregating daily metrics from multiple API sources.
 */

import type {
  DailyMetrics,
  OrdersDailyData,
  FinanceDailyData,
  AdvertisingDailyData,
  AggregateDailyMetricsInput,
} from '@/types/daily-metrics'
import { getDayOfWeek } from './day-utils'

/**
 * Aggregate daily metrics from multiple API sources.
 *
 * Merges data from:
 * - Orders Trends API (orders revenue per day)
 * - Orders Volume API with include_cogs=true (per-day COGS)
 * - Finance Summary API (sales, COGS, logistics, storage)
 * - Advertising API (advertising spend)
 *
 * @param params - Input containing ordersData, financeData, advertisingData, ordersCogsByDay
 * @returns Array of DailyMetrics sorted by date ascending
 */
export function aggregateDailyMetrics(params: AggregateDailyMetricsInput): DailyMetrics[] {
  const { ordersData, financeData, advertisingData, ordersCogsByDay = [] } = params

  // Collect all unique dates from all sources
  const allDates = new Set<string>()
  ordersData.forEach(d => allDates.add(d.date))
  financeData.forEach(d => allDates.add(d.date))
  advertisingData.forEach(d => allDates.add(d.date))
  ordersCogsByDay.forEach(d => allDates.add(d.date))

  // Index data by date for O(1) lookup
  const ordersMap = new Map<string, OrdersDailyData>(ordersData.map(d => [d.date, d]))
  const financeMap = new Map<string, FinanceDailyData>(financeData.map(d => [d.date, d]))
  const advertisingMap = new Map<string, AdvertisingDailyData>(
    advertisingData.map(d => [d.date, d])
  )
  // Per-day COGS map from orders/volume?include_cogs=true (Request #138)
  // Story 88.2-FE: values may be null ("unknown" — COGS not assigned)
  const cogsMap = new Map<string, number | null>(ordersCogsByDay.map(d => [d.date, d.cogs]))

  // Build aggregated result
  const result: DailyMetrics[] = []

  allDates.forEach(date => {
    // Use total_amount (revenue) from orders/trends endpoint (Request #137 fix)
    const ordersEntry = ordersMap.get(date)
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: total_amount (revenue) 0 = missing day = no orders (Story 91.2-FE)
    const orders = ordersEntry?.total_amount ?? 0
    const ordersCount = ordersEntry?.total_orders ?? 0
    const finance = financeMap.get(date)
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: total_spend 0 = no ads ran that day (Story 91.2-FE)
    const advertising = advertisingMap.get(date)?.total_spend ?? 0
    // Story 88.2-FE: preserve null for per-day COGS.
    const dayCogs: number | null = cogsMap.has(date) ? (cogsMap.get(date) ?? null) : null

    // Story 88.2-FE: data-gap detection for debugging
    const financeCogs = finance?.cogs_total ?? null
    if (
      dayCogs == null &&
      financeCogs == null &&
      // eslint-disable-next-line no-restricted-syntax -- DEBUG-LOG: wb_sales_gross used only in boolean/debug log; not user-visible
      (orders > 0 || (finance?.wb_sales_gross ?? 0) > 0)
    ) {
      console.warn(
        // eslint-disable-next-line no-restricted-syntax -- DEBUG-LOG: wb_sales_gross used only in boolean/debug log; not user-visible
        `[DailyAggregation] Data gap: date=${date} has activity (orders=${orders}, sales=${finance?.wb_sales_gross ?? 0}) but both ordersCogs and salesCogs are null.`
      )
    }

    // Story 91.2-FE: prefer finance-sourced advertising_spend when it's > 0 (real data from backend).
    // advertising_spend=0 in old responses means "field absent, not zero ad spend" — fall back to separate API.
    // advertising_spend > 0 always means real data (independent of net_profit nullability).
    // @see Story 91.2-FE — advertising_spend field-absent-vs-zero ambiguity; backend ticket docs/request-backend/144-ISSUE-1-ADVERTISING-SPEND-DISCREPANCY.md.
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: advertising_spend 0 = no ads ran (Story 91.2-FE)
    const financeAd = finance?.advertising_spend ?? 0
    const effectiveAdvertising = financeAd > 0 ? financeAd : advertising

    const metrics: DailyMetrics = {
      date,
      dayOfWeek: getDayOfWeek(date),
      orders,
      ordersCount,
      ordersCogs: dayCogs,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: finance fields 0 = no activity on missing day (Story 91.2-FE)
      sales: finance?.wb_sales_gross ?? 0,
      salesCogs: financeCogs,
      advertising: effectiveAdvertising,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: finance fields 0 = no activity on missing day (logistics/storage/acceptance)
      logistics: finance?.logistics_cost ?? 0,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: finance fields 0 = no activity on missing day (logistics/storage/acceptance)
      storage: finance?.storage_cost ?? 0,
      penalties: finance?.penalties ?? 0,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: finance fields 0 = no activity on missing day (logistics/storage/acceptance)
      paidAcceptance: finance?.paid_acceptance ?? 0,
      commission: finance?.commission ?? 0,
      theoreticalProfit: finance?.net_profit ?? null,
      // Story 92.4 H-3: integer counts from FinanceDailyData, carried for the Monitor weekly chart.
      // Counts default to 0 when backend omits — 0 is a legitimate count (no sales/returns that day).
      salesCount: finance?.sales_count ?? 0,
      returnsCount: finance?.returns_count ?? 0,
    }

    result.push(metrics)
  })

  // Sort by date ascending
  return result.sort((a, b) => a.date.localeCompare(b.date))
}
