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
  TheoreticalProfitInput,
} from '@/types/daily-metrics'
import { getDayOfWeek } from './day-utils'

/**
 * Calculate daily theoretical profit.
 *
 * Formula: orders - ordersCogs - advertising - logistics - storage
 *
 * @param input - Object with orders, ordersCogs, advertising, logistics, storage
 * @returns Calculated theoretical profit (can be negative for loss)
 */
export function calculateDailyTheoreticalProfit(input: TheoreticalProfitInput): number {
  const orders = input.orders ?? 0
  const ordersCogs = input.ordersCogs ?? 0
  const advertising = input.advertising ?? 0
  const logistics = input.logistics ?? 0
  const storage = input.storage ?? 0

  return orders - ordersCogs - advertising - logistics - storage
}

/**
 * Aggregate daily metrics from multiple API sources.
 *
 * Merges data from:
 * - Orders Volume API (orders amount)
 * - Finance Summary API (sales, COGS, logistics, storage)
 * - Advertising API (advertising spend)
 *
 * @param params - Input containing ordersData, financeData, advertisingData
 * @returns Array of DailyMetrics sorted by date ascending
 */
export function aggregateDailyMetrics(params: AggregateDailyMetricsInput): DailyMetrics[] {
  const { ordersData, financeData, advertisingData, ordersCogs = 0 } = params

  // Collect all unique dates from all sources
  const allDates = new Set<string>()
  ordersData.forEach(d => allDates.add(d.date))
  financeData.forEach(d => allDates.add(d.date))
  advertisingData.forEach(d => allDates.add(d.date))

  // Index data by date for O(1) lookup
  const ordersMap = new Map<string, OrdersDailyData>(ordersData.map(d => [d.date, d]))
  const financeMap = new Map<string, FinanceDailyData>(financeData.map(d => [d.date, d]))
  const advertisingMap = new Map<string, AdvertisingDailyData>(
    advertisingData.map(d => [d.date, d])
  )

  // Build aggregated result
  const result: DailyMetrics[] = []

  allDates.forEach(date => {
    const orders = ordersMap.get(date)?.total_amount ?? 0
    const finance = financeMap.get(date)
    const advertising = advertisingMap.get(date)?.total_spend ?? 0

    const metrics: DailyMetrics = {
      date,
      dayOfWeek: getDayOfWeek(date),
      orders,
      ordersCogs,
      sales: finance?.wb_sales_gross ?? 0,
      salesCogs: finance?.cogs_total ?? 0,
      advertising,
      logistics: finance?.logistics_cost ?? 0,
      storage: finance?.storage_cost ?? 0,
      theoreticalProfit: 0,
    }

    // Calculate theoretical profit
    metrics.theoreticalProfit = calculateDailyTheoreticalProfit({
      orders: metrics.orders,
      ordersCogs: metrics.ordersCogs,
      advertising: metrics.advertising,
      logistics: metrics.logistics,
      storage: metrics.storage,
    })

    result.push(metrics)
  })

  // Sort by date ascending
  return result.sort((a, b) => a.date.localeCompare(b.date))
}
