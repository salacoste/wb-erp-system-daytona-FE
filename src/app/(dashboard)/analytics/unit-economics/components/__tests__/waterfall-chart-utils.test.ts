import { describe, it, expect } from 'vitest'
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

  it('treats undefined delivery_to_warehouse as 0 via ?? 0', () => {
    // Item A: revenue=1000, delivery=6%; Item B: revenue=1000, no delivery
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
