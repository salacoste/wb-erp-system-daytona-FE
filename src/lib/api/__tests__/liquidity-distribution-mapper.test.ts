/**
 * Tests for liquidity-distribution-mapper.ts
 * Covers: sumStockValue, avgTurnoverDays, mapDistribution, computeBenchmarks.
 */

import { describe, it, expect } from 'vitest'
import {
  sumStockValue,
  avgTurnoverDays,
  mapDistribution,
  computeBenchmarks,
} from '../liquidity-distribution-mapper'
import type { LiquidityItem } from '@/types/liquidity'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<LiquidityItem> = {}): LiquidityItem {
  return {
    sku_id: '12345',
    product_name: 'Test Product',
    category: 'Test Category',
    brand: 'Test Brand',
    current_stock_qty: 10,
    avg_stock_qty_30d: 10,
    stock_value: 5000,
    units_sold_30d: 30,
    velocity_per_day: 1,
    turnover_days: 30,
    liquidity_category: 'medium',
    current_price: 1000,
    cogs_per_unit: 500,
    recommendation: '',
    action_type: 'MAINTAIN',
    liquidation_scenarios: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// sumStockValue
// ---------------------------------------------------------------------------

describe('sumStockValue', () => {
  it('sums positive stock_value across items', () => {
    const items = [
      makeItem({ stock_value: 1000 }),
      makeItem({ stock_value: 2000 }),
      makeItem({ stock_value: 3000 }),
    ]
    expect(sumStockValue(items)).toBe(6000)
  })

  it('treats null stock_value as 0 (AGGREGATION-REDUCE)', () => {
    const items = [makeItem({ stock_value: null }), makeItem({ stock_value: 2000 })]
    expect(sumStockValue(items)).toBe(2000)
  })

  it('returns 0 for empty array', () => {
    expect(sumStockValue([])).toBe(0)
  })

  it('returns 0 when all items have null stock_value', () => {
    const items = [makeItem({ stock_value: null }), makeItem({ stock_value: null })]
    expect(sumStockValue(items)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// avgTurnoverDays
// ---------------------------------------------------------------------------

describe('avgTurnoverDays', () => {
  it('averages turnover_days for selling items (excludes 999 sentinel)', () => {
    const items = [
      makeItem({ turnover_days: 20 }),
      makeItem({ turnover_days: 40 }),
      makeItem({ turnover_days: 999 }),
    ]
    // average of 20 and 40 = 30, rounded
    expect(avgTurnoverDays(items)).toBe(30)
  })

  it('returns 999 when ALL items are non-selling (>= 999)', () => {
    const items = [makeItem({ turnover_days: 999 }), makeItem({ turnover_days: 1200 })]
    expect(avgTurnoverDays(items)).toBe(999)
  })

  it('returns 0 for empty array', () => {
    expect(avgTurnoverDays([])).toBe(0)
  })

  it('rounds to nearest integer', () => {
    const items = [makeItem({ turnover_days: 10 }), makeItem({ turnover_days: 15 })]
    // average = 12.5, rounded = 13 (Math.round rounds .5 up)
    expect(avgTurnoverDays(items)).toBe(13)
  })

  it('treats items with turnover_days = 0 as selling', () => {
    const items = [makeItem({ turnover_days: 0 }), makeItem({ turnover_days: 40 })]
    // average of 0 and 40 = 20
    expect(avgTurnoverDays(items)).toBe(20)
  })
})

// ---------------------------------------------------------------------------
// mapDistribution
// ---------------------------------------------------------------------------

describe('mapDistribution', () => {
  it('derives distribution from items when no breakdown provided', () => {
    const items = [
      makeItem({ liquidity_category: 'highly_liquid', stock_value: 1000, turnover_days: 15 }),
      makeItem({ liquidity_category: 'medium', stock_value: 2000, turnover_days: 45 }),
      makeItem({ liquidity_category: 'illiquid', stock_value: 5000, turnover_days: 999 }),
    ]
    const dist = mapDistribution(undefined, items)

    // totalValue = 1000 + 2000 + 5000 = 8000
    expect(dist.highly_liquid.count).toBe(1)
    expect(dist.highly_liquid.value).toBe(1000)
    expect(dist.highly_liquid.pct).toBeCloseTo(12.5)
    expect(dist.highly_liquid.avg_turnover_days).toBe(15)
    expect(dist.highly_liquid.no_sales_count).toBe(0)

    expect(dist.medium.count).toBe(1)
    expect(dist.medium.value).toBe(2000)
    expect(dist.medium.pct).toBeCloseTo(25)

    expect(dist.low.count).toBe(0)
    expect(dist.low.value).toBe(0)
    expect(dist.low.pct).toBe(0)

    expect(dist.illiquid.count).toBe(1)
    expect(dist.illiquid.value).toBe(5000)
    expect(dist.illiquid.pct).toBeCloseTo(62.5)
    expect(dist.illiquid.no_sales_count).toBe(1)
  })

  it('maps backend breakdown entries with capital field', () => {
    const items = [
      makeItem({ liquidity_category: 'highly_liquid', stock_value: 3000, turnover_days: 20 }),
    ]
    const breakdown = {
      highly_liquid: { count: 5, capital: 3000 },
      medium: { count: 10, capital: 8000 },
      low: { count: 3, capital: 2000 },
      illiquid: { count: 2, capital: 1000 },
    }
    const dist = mapDistribution(breakdown, items)

    // totalCapital = 3000 + 8000 + 2000 + 1000 = 14000
    expect(dist.highly_liquid.count).toBe(5)
    expect(dist.highly_liquid.value).toBe(3000)
    expect(dist.highly_liquid.pct).toBeCloseTo((3000 / 14000) * 100)
    expect(dist.highly_liquid.avg_turnover_days).toBe(20)

    expect(dist.medium.count).toBe(10)
    expect(dist.medium.value).toBe(8000)
    expect(dist.medium.pct).toBeCloseTo((8000 / 14000) * 100)
    expect(dist.medium.avg_turnover_days).toBe(0) // no medium items → avg of empty selling = 0

    expect(dist.illiquid.count).toBe(2)
    expect(dist.illiquid.value).toBe(1000)
  })

  it('falls back to value field when capital is absent', () => {
    const items = [makeItem({ liquidity_category: 'highly_liquid', turnover_days: 10 })]
    const breakdown = {
      highly_liquid: { count: 3, value: 5000 },
      medium: { count: 0, value: 0 },
    }
    const dist = mapDistribution(breakdown, items)
    expect(dist.highly_liquid.value).toBe(5000)
    expect(dist.highly_liquid.count).toBe(3)
  })

  it('falls back to sku_count when count is absent', () => {
    const breakdown = {
      highly_liquid: { sku_count: 7, capital: 10000 },
    }
    const dist = mapDistribution(breakdown, [])
    expect(dist.highly_liquid.count).toBe(7)
  })

  it('falls back to makeDefault for categories not in breakdown', () => {
    const items = [
      makeItem({ liquidity_category: 'illiquid', stock_value: 2000, turnover_days: 999 }),
    ]
    const breakdown = {
      highly_liquid: { count: 1, capital: 500 },
    }
    const dist = mapDistribution(breakdown, items)

    // highly_liquid from breakdown
    expect(dist.highly_liquid.count).toBe(1)
    expect(dist.highly_liquid.value).toBe(500)

    // illiquid from makeDefault (items-based)
    expect(dist.illiquid.count).toBe(1)
    expect(dist.illiquid.value).toBe(2000)
    expect(dist.illiquid.no_sales_count).toBe(1)
  })

  it('handles null stock_value items: value contributes 0 to category value', () => {
    const items = [
      makeItem({ liquidity_category: 'highly_liquid', stock_value: null, turnover_days: 10 }),
      makeItem({ liquidity_category: 'highly_liquid', stock_value: 2000, turnover_days: 15 }),
    ]
    const dist = mapDistribution(undefined, items)

    expect(dist.highly_liquid.count).toBe(2)
    // null contributes 0, so sum = 0 + 2000 = 2000
    expect(dist.highly_liquid.value).toBe(2000)
  })

  it('derives pct from entry.percentage fallback', () => {
    const breakdown = {
      highly_liquid: { count: 5, capital: 5000, percentage: 42.5 },
    }
    const dist = mapDistribution(breakdown, [])
    expect(dist.highly_liquid.pct).toBe(42.5)
  })

  it('derives avg_turnover_days from entry.avg_turnover fallback', () => {
    const breakdown = {
      highly_liquid: { count: 5, capital: 5000, avg_turnover: 25 },
    }
    const dist = mapDistribution(breakdown, [])
    expect(dist.highly_liquid.avg_turnover_days).toBe(25)
  })
})

// ---------------------------------------------------------------------------
// computeBenchmarks
// ---------------------------------------------------------------------------

describe('computeBenchmarks', () => {
  function makeDist(hPct: number, iPct: number) {
    return {
      highly_liquid: { count: 0, value: 0, pct: hPct, avg_turnover_days: 30, no_sales_count: 0 },
      medium: { count: 0, value: 0, pct: 0, avg_turnover_days: 45, no_sales_count: 0 },
      low: { count: 0, value: 0, pct: 0, avg_turnover_days: 75, no_sales_count: 0 },
      illiquid: { count: 0, value: 0, pct: iPct, avg_turnover_days: 120, no_sales_count: 0 },
    }
  }

  it('returns excellent when highly_liquid >= 50 and illiquid <= 5', () => {
    const items = [makeItem({ turnover_days: 30 })]
    const result = computeBenchmarks(makeDist(55, 3), items)
    expect(result.overall_status).toBe('excellent')
    expect(result.highly_liquid_pct).toBe(55)
    expect(result.illiquid_pct).toBe(3)
    expect(result.target_highly_liquid_pct).toBe(50)
    expect(result.target_illiquid_pct).toBe(5)
    expect(result.target_avg_turnover).toBe(45)
    expect(result.industry_avg_turnover).toBe(52)
    expect(result.your_avg_turnover).toBe(30)
  })

  it('returns good when highly_liquid >= 40 and illiquid <= 10', () => {
    const result = computeBenchmarks(makeDist(42, 8), [])
    expect(result.overall_status).toBe('good')
  })

  it('returns warning when illiquid <= 15 (and not excellent/good)', () => {
    const result = computeBenchmarks(makeDist(30, 12), [])
    expect(result.overall_status).toBe('warning')
  })

  it('returns critical when illiquid > 15', () => {
    const result = computeBenchmarks(makeDist(10, 20), [])
    expect(result.overall_status).toBe('critical')
  })

  it('uses avgTurnoverDays for your_avg_turnover', () => {
    const items = [makeItem({ turnover_days: 60 }), makeItem({ turnover_days: 80 })]
    const result = computeBenchmarks(makeDist(50, 3), items)
    expect(result.your_avg_turnover).toBe(70)
  })

  it('returns 0 your_avg_turnover for empty items', () => {
    const result = computeBenchmarks(makeDist(50, 3), [])
    expect(result.your_avg_turnover).toBe(0)
  })
})
