import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { transformToWaterfallData, WATERFALL_COLORS } from '../waterfall-chart-utils'
import { aggregatePortfolioCosts } from '../useWaterfallData'
import type { UnitEconomicsItem, UnitEconomicsSummary } from '@/types/unit-economics'

const itemCosts = {
  cogs: 30,
  commission: 10,
  logistics_delivery: 8,
  logistics_return: 2,
  storage: 5,
  paid_acceptance: 1,
  penalties: 0.5,
  other_deductions: 1,
  advertising: 3,
  delivery_to_warehouse: null, // Story 96.4-FE: nullable typing — explicit null for "no confirmed shipments"
}
function makeItem(overrides: Partial<UnitEconomicsItem> = {}): UnitEconomicsItem {
  return {
    sku_id: '100',
    product_name: 'Test',
    revenue: 1000,
    units_sold: 10,
    costs_pct: { ...itemCosts },
    costs_rub: { ...itemCosts },
    total_costs_pct: 60,
    net_margin_pct: 10,
    net_profit: 100,
    profitability_status: 'good',
    has_cogs: true,
    ...overrides,
  }
}
const baseSummary: UnitEconomicsSummary = {
  total_revenue: 2000,
  total_net_profit: 200,
  avg_cogs_pct: 30,
  avg_wb_fees_pct: 25,
  avg_net_margin_pct: 10,
  sku_count: 2,
  profitable_sku_count: 2,
  loss_making_sku_count: 0,
  missing_cogs_count: 0,
}
const chartCostsPct: Record<string, number> = {
  cogs: 30,
  commission: 10,
  logistics_delivery: 8,
  logistics_return: 2,
  storage: 5,
  paid_acceptance: 1,
  penalties: 0.5,
  other_deductions: 1,
  advertising: 3,
}
const chartCostsRub: Record<string, number> = {
  cogs: 300,
  commission: 100,
  logistics_delivery: 80,
  logistics_return: 20,
  storage: 50,
  paid_acceptance: 10,
  penalties: 5,
  other_deductions: 10,
  advertising: 30,
}

describe('transformToWaterfallData (chart-level)', () => {
  // Story 96.3-FE: silence console.warn for the legacy 3-arg call sites that intentionally
  // exercise the fallback path (categoryOrder omitted). Restore via vi.restoreAllMocks() in afterEach.
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('first bar is revenue at 100%', () => {
    const result = transformToWaterfallData(1000, chartCostsPct, chartCostsRub)
    expect(result[0].name).toBe('Выручка')
    expect(result[0].value).toBe(100)
    expect(result[0].isRevenue).toBe(true)
    expect(result[0].fill).toBe(WATERFALL_COLORS.revenue)
  })

  it('last bar is profit/loss', () => {
    const result = transformToWaterfallData(1000, chartCostsPct, chartCostsRub)
    const last = result[result.length - 1]
    expect(last.isProfit).toBe(true)
    expect(last.name).toBe('Прибыль')
    expect(last.start).toBe(0)
  })

  it('includes delivery_to_warehouse bar when > 0.5%', () => {
    const costs = { ...chartCostsPct, delivery_to_warehouse: 4.2 }
    const rub = { ...chartCostsRub, delivery_to_warehouse: 42 }
    const result = transformToWaterfallData(1000, costs, rub)
    const bar = result.find(d => d.name === 'Доставка на склад')
    expect(bar).toBeDefined()
    expect(bar!.fill).toBe(WATERFALL_COLORS.delivery_to_warehouse)
    expect(bar!.percentage).toBe(4.2)
    expect(bar!.absoluteValue).toBe(42)
  })

  it('omits delivery_to_warehouse bar when <= 0.5%', () => {
    const costs = { ...chartCostsPct, delivery_to_warehouse: 0.3 }
    const rub = { ...chartCostsRub, delivery_to_warehouse: 3 }
    const result = transformToWaterfallData(1000, costs, rub)
    expect(result.find(d => d.name === 'Доставка на склад')).toBeUndefined()
  })

  it('omits delivery_to_warehouse bar when absent', () => {
    const result = transformToWaterfallData(1000, chartCostsPct, chartCostsRub)
    expect(result.find(d => d.name === 'Доставка на склад')).toBeUndefined()
  })

  it('delivery bar decrements running total (start/end)', () => {
    const costs: Record<string, number> = { delivery_to_warehouse: 4 }
    const rub: Record<string, number> = { delivery_to_warehouse: 40 }
    const result = transformToWaterfallData(1000, costs, rub)
    const bar = result.find(d => d.name === 'Доставка на склад')
    expect(bar).toBeDefined()
    expect(bar!.end).toBe(100)
    expect(bar!.start).toBe(96)
    const profit = result.find(d => d.isProfit)
    expect(profit!.percentage).toBe(96)
  })

  it('profit bar shows loss when costs exceed 100%', () => {
    const costs: Record<string, number> = { cogs: 60, commission: 25, logistics_delivery: 20 }
    const rub: Record<string, number> = { cogs: 600, commission: 250, logistics_delivery: 200 }
    const result = transformToWaterfallData(1000, costs, rub)
    const last = result[result.length - 1]
    expect(last.name).toBe('Убыток')
    expect(last.fill).toBe(WATERFALL_COLORS.loss)
    expect(last.percentage).toBeLessThan(0)
  })
})

// ============================================================================
// Story 96.3-FE: backend-driven category ordering via meta.cost_category_order
// ============================================================================

describe('transformToWaterfallData — categoryOrder (Story 96.3-FE)', () => {
  // Capture spy locally per test via fresh-each-time mock. Use a module-scoped accessor
  // so individual tests can assert on the spy without owning a typed reference variable
  // (the generic `ReturnType<typeof vi.spyOn>` doesn't match `console.warn`'s overload signature
  // — TS reports MockInstance type mismatch). Pattern: call vi.spyOn fresh in each test that
  // needs to inspect the spy; rely on vi.restoreAllMocks() in afterEach to clean up.
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** Helper: get the live console.warn spy that beforeEach installed. */
  function getWarnSpy() {
    // console.warn is the spy reference because beforeEach replaced it.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return console.warn as ReturnType<typeof vi.fn>
  }

  // Backend canonical order per request-backend/173 § F4 + empirical curl in Story 96.2.
  const BACKEND_ORDER = [
    'cogs',
    'delivery_to_warehouse',
    'commission',
    'logistics_delivery',
    'logistics_return',
    'storage',
    'paid_acceptance',
    'penalties',
    'other_deductions',
    'advertising',
  ]

  it('renders cost bars in backend-driven order when categoryOrder provided', () => {
    // Set every category > 0.5% so all 10 render and we can read the order from result.
    const costsPct: Record<string, number> = {
      cogs: 30,
      delivery_to_warehouse: 4,
      commission: 10,
      logistics_delivery: 8,
      logistics_return: 2,
      storage: 5,
      paid_acceptance: 1,
      penalties: 2,
      other_deductions: 1,
      advertising: 3,
    }
    const costsRub: Record<string, number> = Object.fromEntries(
      Object.entries(costsPct).map(([k, v]) => [k, v * 10])
    )

    const result = transformToWaterfallData(1000, costsPct, costsRub, BACKEND_ORDER)

    // Strip revenue (first) + profit (last); the middle bars are cost categories.
    const costNames = result.slice(1, -1).map(d => d.name)
    expect(costNames).toEqual([
      'COGS',
      'Доставка на склад', // delivery_to_warehouse — position 2 per backend (was 6 in hardcoded fallback)
      'Комиссия',
      'Доставка',
      'Возвраты',
      'Хранение',
      'Приёмка',
      'Штрафы',
      'Прочее',
      'Реклама',
    ])

    // Backend-driven path: NO console.warn fired.
    expect(getWarnSpy()).not.toHaveBeenCalled()
  })

  it('falls back to hardcoded order with console.warn when categoryOrder is undefined', () => {
    const costsPct: Record<string, number> = { cogs: 30, commission: 10, delivery_to_warehouse: 4 }
    const costsRub: Record<string, number> = {
      cogs: 300,
      commission: 100,
      delivery_to_warehouse: 40,
    }

    const result = transformToWaterfallData(1000, costsPct, costsRub, undefined)
    const costNames = result.slice(1, -1).map(d => d.name)

    // Hardcoded fallback order: cogs, commission, ..., delivery_to_warehouse at position 6.
    // Filtered to bars >0.5%, so only cogs+commission+delivery render in this test.
    expect(costNames[0]).toBe('COGS')
    expect(costNames[1]).toBe('Комиссия')
    expect(costNames.indexOf('Доставка на склад')).toBeGreaterThan(1) // hardcoded puts it later
    expect(getWarnSpy()).toHaveBeenCalledTimes(1)
    expect(getWarnSpy()).toHaveBeenCalledWith(
      expect.stringContaining('cost_category_order missing')
    )
  })

  it('falls back to hardcoded order with console.warn when categoryOrder is empty array', () => {
    const costsPct: Record<string, number> = { cogs: 30, commission: 10 }
    const costsRub: Record<string, number> = { cogs: 300, commission: 100 }

    transformToWaterfallData(1000, costsPct, costsRub, [])

    expect(getWarnSpy()).toHaveBeenCalledTimes(1)
    expect(getWarnSpy()).toHaveBeenCalledWith(
      expect.stringContaining('cost_category_order missing')
    )
  })

  it('skips unknown category keys gracefully (backend additive change)', () => {
    // Backend hypothetically adds a new category 'mystery_fee' — frontend should skip
    // (not crash) since it doesn't have a label/color mapping for it.
    const orderWithUnknown = ['cogs', 'mystery_fee', 'commission']
    const costsPct: Record<string, number> = { cogs: 30, mystery_fee: 5, commission: 10 }
    const costsRub: Record<string, number> = { cogs: 300, mystery_fee: 50, commission: 100 }

    const result = transformToWaterfallData(1000, costsPct, costsRub, orderWithUnknown)
    const costNames = result.slice(1, -1).map(d => d.name)

    expect(costNames).toEqual(['COGS', 'Комиссия']) // mystery_fee silently skipped
    expect(getWarnSpy()).not.toHaveBeenCalled() // backend-driven path, no fallback warn
  })

  it('respects > 0.5% threshold even in backend-driven order', () => {
    const costsPct: Record<string, number> = {
      cogs: 30,
      delivery_to_warehouse: 0.3,
      commission: 10,
    }
    const costsRub: Record<string, number> = {
      cogs: 300,
      delivery_to_warehouse: 3,
      commission: 100,
    }

    const result = transformToWaterfallData(1000, costsPct, costsRub, BACKEND_ORDER)
    const costNames = result.slice(1, -1).map(d => d.name)

    // delivery_to_warehouse at 0.3% should be omitted; cogs + commission remain.
    expect(costNames).toEqual(['COGS', 'Комиссия'])
  })
})

describe('aggregatePortfolioCosts', () => {
  it('computes weighted average delivery_to_warehouse across items', () => {
    // Item A: revenue=1000 (50% weight), delivery=6%
    // Item B: revenue=1000 (50% weight), delivery=2%
    // Weighted avg = 6*0.5 + 2*0.5 = 4%
    const items = [
      makeItem({
        sku_id: 'A',
        revenue: 1000,
        costs_pct: { ...itemCosts, delivery_to_warehouse: 6 },
      }),
      makeItem({
        sku_id: 'B',
        revenue: 1000,
        costs_pct: { ...itemCosts, delivery_to_warehouse: 2 },
      }),
    ]
    const { costsPct } = aggregatePortfolioCosts(items, baseSummary)
    expect(costsPct.delivery_to_warehouse).toBe(4)
  })

  it('treats null delivery_to_warehouse as 0 via ?? 0 (Story 96.4-FE: was previously "undefined" via optional ?:)', () => {
    // Item A: revenue=1000, delivery=6%; Item B: revenue=1000, no delivery (delivery_to_warehouse=null)
    // Weighted avg = 6*0.5 + 0*0.5 = 3%
    const items = [
      makeItem({
        sku_id: 'A',
        revenue: 1000,
        costs_pct: { ...itemCosts, delivery_to_warehouse: 6 },
      }),
      makeItem({ sku_id: 'B', revenue: 1000 }),
    ]
    const { costsPct } = aggregatePortfolioCosts(items, baseSummary)
    expect(costsPct.delivery_to_warehouse).toBe(3)
  })

  it('returns 0 delivery when all items lack delivery data', () => {
    const items = [
      makeItem({ sku_id: 'A', revenue: 1000 }),
      makeItem({ sku_id: 'B', revenue: 1000 }),
    ]
    const { costsPct } = aggregatePortfolioCosts(items, baseSummary)
    expect(costsPct.delivery_to_warehouse).toBe(0)
  })

  it('computes costsRub from percentages and total revenue', () => {
    const items = [
      makeItem({
        sku_id: 'A',
        revenue: 1000,
        costs_pct: { ...itemCosts, delivery_to_warehouse: 5 },
      }),
      makeItem({
        sku_id: 'B',
        revenue: 1000,
        costs_pct: { ...itemCosts, delivery_to_warehouse: 5 },
      }),
    ]
    const { costsRub } = aggregatePortfolioCosts(items, baseSummary)
    // 5% of 2000 total revenue = 100
    expect(costsRub.delivery_to_warehouse).toBe(100)
  })
})
