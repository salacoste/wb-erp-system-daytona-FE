import { describe, it, expect } from 'vitest'
import {
  countOverAttributionItems,
  filterOutOverAttribution,
  recomputeSummary,
} from '../over-attribution-utils'
import type { AdvertisingItem, AdvertisingSummary } from '@/types/advertising-analytics'

/** Minimal item factory for testing */
function makeItem(overrides: Partial<AdvertisingItem> = {}): AdvertisingItem {
  return {
    key: 'sku:1',
    imtId: null,
    spend: 1000,
    revenue: 500,
    total_sales: 800,
    organic_sales: 300,
    organic_contribution: 37.5,
    profit: 300,
    orders: 10,
    clicks: 100,
    views: 1000,
    ctr: 10,
    cpc: 10,
    roas: 0.5,
    roi: -0.5,
    conversion_rate: 10,
    profit_after_ads: -700,
    efficiency_status: 'profitable',
    ...overrides,
  } as AdvertisingItem
}

const baseSummary: AdvertisingSummary = {
  total_spend: 5000,
  total_revenue: 3000,
  total_sales: 8000,
  total_organic_sales: 5000,
  total_profit: 2000,
  overall_roas: 0.6,
  overall_roi: -0.4,
  avg_ctr: 5,
  avg_conversion_rate: 10,
  campaign_count: 5,
  active_campaigns: 3,
  avg_organic_contribution: 62.5,
}

describe('countOverAttributionItems', () => {
  it('returns 0 for empty array', () => {
    expect(countOverAttributionItems([])).toBe(0)
  })

  it('returns 0 when no items have negative organic_sales', () => {
    const items = [makeItem({ organic_sales: 100 }), makeItem({ organic_sales: 0 })]
    expect(countOverAttributionItems(items)).toBe(0)
  })

  it('counts items with negative organic_sales', () => {
    const items = [
      makeItem({ organic_sales: 100 }),
      makeItem({ organic_sales: -50 }),
      makeItem({ organic_sales: -200 }),
      makeItem({ organic_sales: 0 }),
    ]
    expect(countOverAttributionItems(items)).toBe(2)
  })
})

describe('filterOutOverAttribution', () => {
  it('returns empty array for empty input', () => {
    expect(filterOutOverAttribution([])).toEqual([])
  })

  it('keeps all items when none have negative organic_sales', () => {
    const items = [makeItem({ organic_sales: 100 }), makeItem({ organic_sales: 0 })]
    expect(filterOutOverAttribution(items)).toHaveLength(2)
  })

  it('removes items with negative organic_sales', () => {
    const items = [
      makeItem({ key: 'sku:1', organic_sales: 100 }),
      makeItem({ key: 'sku:2', organic_sales: -50 }),
      makeItem({ key: 'sku:3', organic_sales: 200 }),
    ]
    const result = filterOutOverAttribution(items)
    expect(result).toHaveLength(2)
    expect(result.map(i => i.key)).toEqual(['sku:1', 'sku:3'])
  })
})

describe('recomputeSummary', () => {
  it('recomputes aggregates from filtered items', () => {
    const items = [
      makeItem({ spend: 1000, revenue: 500, profit: 200, total_sales: 800, organic_sales: 300 }),
      makeItem({ spend: 2000, revenue: 1500, profit: 800, total_sales: 3000, organic_sales: 1500 }),
    ]
    const result = recomputeSummary(items, baseSummary)
    expect(result.total_spend).toBe(3000)
    expect(result.total_revenue).toBe(2000)
    expect(result.total_sales).toBe(3800)
    expect(result.total_profit).toBe(1000)
    expect(result.total_organic_sales).toBe(1800)
    expect(result.overall_roas).toBeCloseTo(2000 / 3000, 5)
    expect(result.overall_roi).toBeCloseTo((1000 - 3000) / 3000, 5)
    expect(result.avg_organic_contribution).toBeCloseTo((1800 / 3800) * 100, 5)
  })

  it('preserves non-aggregate fields from original summary', () => {
    const items = [makeItem({ spend: 100, revenue: 50, total_sales: 80, organic_sales: 30 })]
    const result = recomputeSummary(items, baseSummary)
    expect(result.active_campaigns).toBe(3)
    expect(result.campaign_count).toBe(5)
  })

  // Story 88.2-FE: when spend = 0, ROAS/ROI are null ("undefined division"), not 0
  it('handles zero spend (roas = null, roi = null)', () => {
    const items = [makeItem({ spend: 0, revenue: 100, total_sales: 200, organic_sales: 100 })]
    const result = recomputeSummary(items, baseSummary)
    expect(result.overall_roas).toBeNull()
    expect(result.overall_roi).toBeNull()
  })

  it('handles zero sales (organic_contribution = 0)', () => {
    const items = [makeItem({ spend: 100, revenue: 0, total_sales: 0, organic_sales: 0 })]
    const result = recomputeSummary(items, baseSummary)
    expect(result.avg_organic_contribution).toBe(0)
  })

  it('handles empty items array', () => {
    const result = recomputeSummary([], baseSummary)
    expect(result.total_spend).toBe(0)
    expect(result.total_revenue).toBe(0)
    expect(result.total_sales).toBe(0)
    // Story 88.2-FE: empty items → spend=0 → ROAS is null (undefined division)
    expect(result.overall_roas).toBeNull()
    expect(result.avg_organic_contribution).toBe(0)
  })
})
