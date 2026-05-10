import { describe, it, expect } from 'vitest'
import { aggregatePortfolioCosts } from '../useWaterfallData'
import type { UnitEconomicsItem, UnitEconomicsSummary } from '@/types/unit-economics'

const EXPECTED_CATEGORIES = [
  'cogs',
  'commission',
  'logistics_delivery',
  'logistics_return',
  'storage',
  'delivery_to_warehouse',
  'paid_acceptance',
  'penalties',
  'other_deductions',
  'advertising',
] as const

describe('aggregatePortfolioCosts — 10-category invariant (Story 96.10-FE AC-4)', () => {
  it('returns exactly 10 cost-category keys in costsPct', () => {
    const summary = {
      total_revenue: 100000,
      total_net_profit: 25000,
      sku_count: 1,
      avg_cogs_pct: 30,
      avg_wb_fees_pct: 20,
      avg_net_margin_pct: 25,
      profitable_sku_count: 1,
      loss_making_sku_count: 0,
      missing_cogs_count: 0,
    } as UnitEconomicsSummary
    const data: UnitEconomicsItem[] = []
    const { costsPct } = aggregatePortfolioCosts(data, summary)
    expect(Object.keys(costsPct).sort()).toEqual([...EXPECTED_CATEGORIES].sort())
    expect(Object.keys(costsPct)).toHaveLength(10)
  })

  it('returns exactly 10 cost-category keys in costsRub', () => {
    const summary = {
      total_revenue: 100000,
      total_net_profit: 0,
      sku_count: 0,
      avg_cogs_pct: 0,
      avg_wb_fees_pct: 0,
      avg_net_margin_pct: 0,
      profitable_sku_count: 0,
      loss_making_sku_count: 0,
      missing_cogs_count: 0,
    } as UnitEconomicsSummary
    const { costsRub } = aggregatePortfolioCosts([], summary)
    expect(Object.keys(costsRub)).toHaveLength(10)
  })

  it('preserves the canonical 10-category set even with empty data', () => {
    const summary = {
      total_revenue: 0,
      total_net_profit: 0,
      sku_count: 0,
      avg_cogs_pct: 0,
      avg_wb_fees_pct: 0,
      avg_net_margin_pct: 0,
      profitable_sku_count: 0,
      loss_making_sku_count: 0,
      missing_cogs_count: 0,
    } as UnitEconomicsSummary
    const { costsPct } = aggregatePortfolioCosts([], summary)
    EXPECTED_CATEGORIES.forEach(cat => {
      expect(costsPct).toHaveProperty(cat)
    })
  })
})
