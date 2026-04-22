/**
 * Tests for daily aggregation — Story 88.2-FE null-preservation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { aggregateDailyMetrics, calculateDailyTheoreticalProfit } from '../aggregation'
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

describe('calculateDailyTheoreticalProfit — Story 88.2-FE null salesCogs handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('treats null salesCogs as 0 internally (best-effort estimate)', () => {
    const result = calculateDailyTheoreticalProfit({
      sales: 10000,
      salesCogs: null,
      advertising: 500,
      logistics: 200,
      storage: 100,
      penalties: 0,
      paidAcceptance: 0,
      commission: 1000,
    })
    // 10000 - 0 (null→0) - 500 - 200 - 100 - 0 - 0 - 1000 = 8200
    expect(result).toBe(8200)
    expect(Number.isNaN(result)).toBe(false)
  })

  it('returns a number (not NaN) when every nullable field is null', () => {
    const result = calculateDailyTheoreticalProfit({
      sales: 5000,
      salesCogs: null,
      advertising: 0,
      logistics: 0,
      storage: 0,
      penalties: 0,
      paidAcceptance: 0,
      commission: 0,
    })
    expect(result).toBe(5000)
    expect(Number.isNaN(result)).toBe(false)
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
    // Should use server netProfit (4500), not client-side calc
    expect(result[0].theoreticalProfit).toBe(4500)
  })

  it('falls back to client-side calc when netProfit is null', () => {
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
    // Fallback: client-side calc with salesCogs=null→0
    // 10000 - 0 - 500 - 0 - 0 - 0 - 0 - 0 = 9500
    expect(result[0].theoreticalProfit).toBe(9500)
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
