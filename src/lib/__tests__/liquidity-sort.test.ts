/**
 * Tests for liquidity table sort helpers (Epic 7).
 *
 * Guards the 2026-06-04 fix for the page-breaking 400: the table's stock_value / velocity_per_day
 * UI columns are not in the backend LiquiditySortByEnum, so they must be mapped to a valid enum for
 * the request and applied client-side instead.
 */

import { describe, it, expect } from 'vitest'
import { mapLiquiditySortToApi, sortLiquidityItems } from '../liquidity-sort'
import type { LiquidityItem } from '@/types/liquidity'

const BACKEND_ENUM = ['frozen_capital', 'turnover_days', 'current_stock', 'product_name']

function makeItem(overrides: Partial<LiquidityItem> = {}): LiquidityItem {
  return {
    sku_id: 'sku-1',
    product_name: 'Item',
    category: 'cat',
    brand: 'brand',
    current_stock_qty: 10,
    avg_stock_qty_30d: 10,
    stock_value: 1000,
    units_sold_30d: 5,
    velocity_per_day: 1,
    turnover_days: 10,
    liquidity_category: 'medium',
    current_price: 100,
    cogs_per_unit: 50,
    recommendation: '',
    action_type: 'MAINTAIN',
    liquidation_scenarios: null,
    ...overrides,
  }
}

describe('mapLiquiditySortToApi', () => {
  it('maps stock_value → frozen_capital (the backend inventory-value sort)', () => {
    expect(mapLiquiditySortToApi('stock_value')).toBe('frozen_capital')
  })

  it('maps velocity_per_day → turnover_days (no backend velocity sort; sorted client-side)', () => {
    expect(mapLiquiditySortToApi('velocity_per_day')).toBe('turnover_days')
  })

  it('passes turnover_days through unchanged', () => {
    expect(mapLiquiditySortToApi('turnover_days')).toBe('turnover_days')
  })

  it('NEVER emits a value the backend @IsEnum rejects (the 400 cause)', () => {
    for (const field of ['stock_value', 'velocity_per_day', 'turnover_days'] as const) {
      expect(BACKEND_ENUM).toContain(mapLiquiditySortToApi(field))
    }
  })
})

describe('sortLiquidityItems', () => {
  const items = [
    makeItem({ sku_id: 'a', turnover_days: 30, stock_value: 100, velocity_per_day: 0.5 }),
    makeItem({ sku_id: 'b', turnover_days: 10, stock_value: 300, velocity_per_day: 2.0 }),
    makeItem({ sku_id: 'c', turnover_days: 20, stock_value: 200, velocity_per_day: 1.0 }),
  ]

  it('sorts by turnover_days descending', () => {
    const order = sortLiquidityItems(items, 'turnover_days', 'desc').map(i => i.sku_id)
    expect(order).toEqual(['a', 'c', 'b'])
  })

  it('sorts by turnover_days ascending', () => {
    const order = sortLiquidityItems(items, 'turnover_days', 'asc').map(i => i.sku_id)
    expect(order).toEqual(['b', 'c', 'a'])
  })

  it('sorts by stock_value descending', () => {
    const order = sortLiquidityItems(items, 'stock_value', 'desc').map(i => i.sku_id)
    expect(order).toEqual(['b', 'c', 'a'])
  })

  it('sorts by velocity_per_day (backend cannot) descending', () => {
    const order = sortLiquidityItems(items, 'velocity_per_day', 'desc').map(i => i.sku_id)
    expect(order).toEqual(['b', 'c', 'a'])
  })

  it('does not mutate the input array', () => {
    const original = [...items]
    sortLiquidityItems(items, 'stock_value', 'asc')
    expect(items).toEqual(original)
  })

  it('treats NaN/non-finite keys as 0 so they do not scatter', () => {
    const withNaN = [
      makeItem({ sku_id: 'x', velocity_per_day: Number.NaN }),
      makeItem({ sku_id: 'y', velocity_per_day: 5 }),
    ]
    const order = sortLiquidityItems(withNaN, 'velocity_per_day', 'desc').map(i => i.sku_id)
    expect(order).toEqual(['y', 'x']) // 5 before 0 (NaN→0)
  })
})
