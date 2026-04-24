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

describe('aggregateDailyMetrics — Story 93.2-FE discrepancy telemetry', () => {
  const ordersData: OrdersDailyData[] = []
  const advertisingData: AdvertisingDailyData[] = []

  beforeEach(() => {
    vi.stubEnv('VITEST_EXPECT_LOG', '1')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('uses server netProfit and logs no warning when server and client agree', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // net_profit=12345, client calc: 12345 - 0 - 0 - 0 - 0 - 0 - 0 - 0 = 12345
    const financeData: FinanceDailyData[] = [
      makeFinance({
        date: '2026-04-24',
        wb_sales_gross: 12345,
        net_profit: 12345,
      }),
    ]
    const result = aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    // Server wins and no [NetProfitDiscrepancy] warn (values match — below threshold)
    expect(result[0].theoreticalProfit).toBe(12345)
    const discrepancyCalls = warnSpy.mock.calls.filter(
      args => typeof args[0] === 'string' && (args[0] as string).includes('[NetProfitDiscrepancy]')
    )
    expect(discrepancyCalls).toHaveLength(0)
  })

  it('uses server netProfit and logs warning when values diverge beyond threshold', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // server=12345, client calc: 20000 - 3000 - 500 - 500 - 500 - 500 - 500 - 2155 = 12345
    // To produce divergence: set sales high so client calc ~14000 but server=12345
    // client: 20000 - 0(salesCogs null→0) - 500 - 500 - 500 - 500 - 500 - 3455 = 14045 → diff=1700, rel=13.77%
    const financeData: FinanceDailyData[] = [
      makeFinance({
        date: '2026-04-24',
        wb_sales_gross: 20000,
        cogs_total: null, // salesCogs=null → 0 in client calc
        net_profit: 12345,
        advertising_spend: 500,
        logistics_cost: 500,
        storage_cost: 500,
        penalties: 500,
        paid_acceptance: 500,
        commission: 3455,
      }),
    ]
    const result = aggregateDailyMetrics({ ordersData, financeData, advertisingData })
    // Server still wins
    expect(result[0].theoreticalProfit).toBe(12345)
    // A [NetProfitDiscrepancy] warn should have fired
    const discrepancyCalls = warnSpy.mock.calls.filter(
      args => typeof args[0] === 'string' && (args[0] as string).includes('[NetProfitDiscrepancy]')
    )
    expect(discrepancyCalls).toHaveLength(1)
    const msg = discrepancyCalls[0][0] as string
    expect(msg).toContain('2026-04-24')
    expect(msg).toContain('12345.00')
    expect(msg).toContain('14045')
  })

  it('falls back to client calc when server netProfit is null and logs no warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // client calc: 10000 - 0 - 500 - 0 - 0 - 0 - 0 - 0 = 9500
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
    expect(result[0].theoreticalProfit).toBe(9500)
    const discrepancyCalls = warnSpy.mock.calls.filter(
      args => typeof args[0] === 'string' && (args[0] as string).includes('[NetProfitDiscrepancy]')
    )
    expect(discrepancyCalls).toHaveLength(0)
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
