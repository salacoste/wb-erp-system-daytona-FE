/**
 * Tests for daily aggregation — Story 88.2-FE null-preservation
 */

import { describe, it, expect, vi } from 'vitest'
import { aggregateDailyMetrics } from '../aggregation'
import type {
  FinanceDailyData,
  OrdersDailyData,
  AdvertisingDailyData,
  OrdersCogsDailyData,
} from '@/types/daily-metrics'

function makeFinance(partial: Partial<FinanceDailyData> & { date: string }): FinanceDailyData {
  // Default cogs_total = 0 (legitimate zero cost). When test needs explicit null, pass `cogs_total: null`.
  // Using spread at the end to let null values from `partial` override the default 0.
  const base: FinanceDailyData = {
    date: partial.date,
    wb_sales_gross: 0,
    revenue_net: 0,
    cogs_total: 0,
    logistics_cost: 0,
    storage_cost: 0,
    penalties: 0,
    paid_acceptance: 0,
    commission: 0,
    returns: 0,
    returns_count: 0,
    sales_count: 0,
    advertising_spend: 0,
    net_profit: null,
  }
  return { ...base, ...partial }
}

describe('aggregateDailyMetrics — Story 88.2-FE null COGS propagation', () => {
  const ordersData: OrdersDailyData[] = []
  const advertisingData: AdvertisingDailyData[] = []

  it('propagates null finance.cogs_total → metrics.salesCogs', () => {
    const financeData: FinanceDailyData[] = [
      makeFinance({ date: '2026-01-01', wb_sales_gross: 5000, cogs_total: null }),
    ]
    const result = aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    expect(result).toHaveLength(1)
    expect(result[0].salesCogs).toBeNull()
  })

  it('propagates null orders COGS map entry → metrics.ordersCogs', () => {
    const financeData: FinanceDailyData[] = []
    const ordersCogsByDay: OrdersCogsDailyData[] = [{ date: '2026-01-01', cogs: null }]
    const result = aggregateDailyMetrics({
      ordersData,
      financeData,
      advertisingData,
      ordersCogsByDay,
    })
    expect(result[0].ordersCogs).toBeNull()
  })

  it('preserves cogs_total: 0 (legitimate zero, distinct from null)', () => {
    const financeData: FinanceDailyData[] = [
      makeFinance({ date: '2026-01-01', wb_sales_gross: 5000, cogs_total: 0 }),
    ]
    const result = aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    expect(result[0].salesCogs).toBe(0)
  })

  it('emits console.warn when both COGS values are null and there is activity', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const financeData: FinanceDailyData[] = [
      makeFinance({ date: '2026-01-01', wb_sales_gross: 5000, cogs_total: null }),
    ]
    aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

describe('aggregateDailyMetrics — Story 92.4-FE salesCount + returnsCount propagation', () => {
  const ordersData: OrdersDailyData[] = []
  const advertisingData: AdvertisingDailyData[] = []

  it('carries sales_count and returns_count from FinanceDailyData into DailyMetrics', () => {
    const financeData: FinanceDailyData[] = [
      makeFinance({ date: '2026-01-01', sales_count: 12, returns_count: 1 }),
    ]
    const result = aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      salesCount: 12,
      returnsCount: 1,
    })
  })

  it('defaults salesCount and returnsCount to 0 when finance data absent', () => {
    // No finance data for this date — values come from ordersData only
    const result = aggregateDailyMetrics({
      ordersData: [{ date: '2026-01-02', total_amount: 5000, total_orders: 3 }],
      financeData: [],
      advertisingData,
    })
    expect(result[0].salesCount).toBe(0)
    expect(result[0].returnsCount).toBe(0)
  })
})

describe('aggregateDailyMetrics — Story 100.2-FE server netProfit exclusive use', () => {
  const ordersData: OrdersDailyData[] = []
  const advertisingData: AdvertisingDailyData[] = []

  it('uses server netProfit when available', () => {
    const financeData: FinanceDailyData[] = [
      makeFinance({
        date: '2026-04-24',
        wb_sales_gross: 12345,
        net_profit: 12345,
      }),
    ]
    const result = aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    expect(result[0].theoreticalProfit).toBe(12345)
  })

  it('sets theoreticalProfit to 0 when server netProfit is null (COGS unknown)', () => {
    const financeData: FinanceDailyData[] = [
      makeFinance({
        date: '2026-04-24',
        wb_sales_gross: 10000,
        cogs_total: null,
        net_profit: null,
        advertising_spend: 500,
      }),
    ]
    const result = aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    expect(result[0].theoreticalProfit).toBe(0)
  })
})

describe('aggregateDailyMetrics — Story 91.2-FE server netProfit integration', () => {
  const ordersData: OrdersDailyData[] = []
  const advertisingData: AdvertisingDailyData[] = []

  it('uses server netProfit when available (instead of client-side calc)', () => {
    const financeData: FinanceDailyData[] = [
      makeFinance({
        date: '2026-01-01',
        wb_sales_gross: 10000,
        cogs_total: 3000,
        net_profit: 4500, // server-computed
        advertising_spend: 500,
      }),
    ]
    const result = aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    expect(result[0].theoreticalProfit).toBe(4500)
  })

  it('sets theoreticalProfit to 0 when netProfit is null (no client-side fallback)', () => {
    const financeData: FinanceDailyData[] = [
      makeFinance({
        date: '2026-01-01',
        wb_sales_gross: 10000,
        cogs_total: null, // COGS unknown → backend sends null netProfit
        net_profit: null,
        advertising_spend: 500,
      }),
    ]
    const result = aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    expect(result[0].theoreticalProfit).toBe(0)
  })

  it('prefers finance advertisingSpend over separate advertising API', () => {
    const financeData: FinanceDailyData[] = [
      makeFinance({
        date: '2026-01-01',
        advertising_spend: 800, // from finance endpoint
        net_profit: 5000,
      }),
    ]
    const advertisingDataWithDifferentValue: AdvertisingDailyData[] = [
      { date: '2026-01-01', total_spend: 750 }, // from separate advertising API (different!)
    ]
    const result = aggregateDailyMetrics({
      ordersData,
      financeData,
      advertisingData: advertisingDataWithDifferentValue,
    })
    // Finance-sourced advertising (800) should win over separate API (750)
    expect(result[0].advertising).toBe(800)
  })
})
