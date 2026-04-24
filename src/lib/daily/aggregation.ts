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
import { compareServerClientProfit, logDiscrepancy } from './server-client-discrepancy'

/**
 * @deprecated Story 91.2-FE: Use server netProfit instead. Kept for fallback calc.
 * Extracted from daily-metrics.ts to keep that file under 200 lines.
 * @see Story 93.2-FE — src/lib/daily/server-client-discrepancy.ts
 */
export interface TheoreticalProfitInput {
  sales: number
  salesCogs: number | null
  advertising: number
  logistics: number
  storage: number
  penalties: number
  paidAcceptance: number
  commission: number
}

/**
 * Calculate daily theoretical profit (client-side).
 *
 * @deprecated Story 91.2-FE: Use server `netProfit` from GET /v1/analytics/daily/finance instead.
 * Kept as fallback for: (a) cached pre-rollout responses, (b) null netProfit when COGS unknown.
 * Remove after Story 93.2-FE's discrepancy telemetry confirms zero beyondThreshold
 * events across a representative production window. Decision tracked in Epic 93-FE retro.
 * @see Story 93.2-FE — src/lib/daily/server-client-discrepancy.ts
 *
 * Formula: sales - salesCogs - advertising - logistics - storage - penalties - paidAcceptance - commission
 *
 * @param input - All cost components for a single day
 * @returns Calculated theoretical profit (can be negative for loss)
 */
export function calculateDailyTheoreticalProfit(input: TheoreticalProfitInput): number {
  const sales = input.sales ?? 0
  // aggregation — null treated as 0, intentional. Display sites must show "—" for null salesCogs.
  const salesCogs = input.salesCogs ?? 0
  const advertising = input.advertising ?? 0
  const logistics = input.logistics ?? 0
  const storage = input.storage ?? 0
  const penalties = input.penalties ?? 0
  const paidAcceptance = input.paidAcceptance ?? 0
  const commission = input.commission ?? 0

  return (
    sales - salesCogs - advertising - logistics - storage - penalties - paidAcceptance - commission
  )
}

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
  const { ordersData, financeData, advertisingData, ordersCogsByDay = [], ordersCogs = 0 } = params

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
    const orders = ordersEntry?.total_amount ?? 0
    const ordersCount = ordersEntry?.total_orders ?? 0
    const finance = financeMap.get(date)
    const advertising = advertisingMap.get(date)?.total_spend ?? 0
    // Story 88.2-FE: preserve null for per-day COGS.
    // If cogsMap has the date: use its value (may be null).
    // If cogsMap doesn't: fall back to legacy single value.
    // Note: `ordersCogs = 0` is the destructuring default — unset vs explicit-0 are indistinguishable
    // here; we treat 0 as "no legacy COGS provided" → null. Callers wanting "zero cost" must pass
    // ordersCogsByDay instead (the legacy ordersCogs param is deprecated).
    const dayCogs: number | null = cogsMap.has(date)
      ? (cogsMap.get(date) ?? null)
      : ordersCogs > 0
        ? ordersCogs
        : null

    // Story 88.2-FE: data-gap detection for debugging
    const financeCogs = finance?.cogs_total ?? null
    if (
      dayCogs == null &&
      financeCogs == null &&
      (orders > 0 || (finance?.wb_sales_gross ?? 0) > 0)
    ) {
      console.warn(
        `[DailyAggregation] Data gap: date=${date} has activity (orders=${orders}, sales=${finance?.wb_sales_gross ?? 0}) but both ordersCogs and salesCogs are null.`
      )
    }

    // Story 91.2-FE: prefer finance-sourced advertising_spend when it's > 0 (real data from backend).
    // advertising_spend=0 in old responses means "field absent, not zero ad spend" — fall back to separate API.
    // advertising_spend > 0 always means real data (independent of net_profit nullability).
    // @see Story 91.2-FE — advertising_spend field-absent-vs-zero ambiguity; backend ticket docs/request-backend/144-ISSUE-1-ADVERTISING-SPEND-DISCREPANCY.md.
    const financeAd = finance?.advertising_spend ?? 0
    const effectiveAdvertising = financeAd > 0 ? financeAd : advertising

    const metrics: DailyMetrics = {
      date,
      dayOfWeek: getDayOfWeek(date),
      orders,
      ordersCount,
      ordersCogs: dayCogs,
      sales: finance?.wb_sales_gross ?? 0,
      salesCogs: financeCogs,
      advertising: effectiveAdvertising,
      logistics: finance?.logistics_cost ?? 0,
      storage: finance?.storage_cost ?? 0,
      penalties: finance?.penalties ?? 0,
      paidAcceptance: finance?.paid_acceptance ?? 0,
      commission: finance?.commission ?? 0,
      theoreticalProfit: 0,
      // Story 92.4 H-3: integer counts from FinanceDailyData, carried for the Monitor weekly chart.
      // Counts default to 0 when backend omits — 0 is a legitimate count (no sales/returns that day).
      salesCount: finance?.sales_count ?? 0,
      returnsCount: finance?.returns_count ?? 0,
    }

    // Story 93.2-FE: both values computed when possible, server wins, divergence logged.
    // Replaces Story 91.2-FE's server-first-only branch.
    // @see Story 93.2-FE — src/lib/daily/server-client-discrepancy.ts
    const serverNetProfit = finance?.net_profit
    const clientValue = calculateDailyTheoreticalProfit({
      sales: metrics.sales,
      salesCogs: metrics.salesCogs,
      advertising: metrics.advertising,
      logistics: metrics.logistics,
      storage: metrics.storage,
      penalties: metrics.penalties,
      paidAcceptance: metrics.paidAcceptance,
      commission: metrics.commission,
    })

    if (serverNetProfit != null) {
      // Server wins — but log divergence for removal-decision telemetry.
      const d = compareServerClientProfit(metrics.date, serverNetProfit, clientValue)
      logDiscrepancy(d)
      metrics.theoreticalProfit = serverNetProfit
    } else {
      metrics.theoreticalProfit = clientValue
    }

    result.push(metrics)
  })

  // Sort by date ascending
  return result.sort((a, b) => a.date.localeCompare(b.date))
}
