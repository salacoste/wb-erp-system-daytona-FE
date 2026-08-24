/**
 * Tests for useSupplyTableFilters reorder_value sort + formatReorderValue null handling.
 *
 * Regression (2026-06-04): reorder_value is OPTIONAL (backend omits it when COGS is unassigned),
 * but the sort comparator did `a.reorder_value - b.reorder_value` → `undefined - number = NaN`,
 * which scrambles Array.sort. Now coalesced to -Infinity so unknown values sort last and defined
 * values stay correctly ordered. formatReorderValue renders "—" for undefined/null (anti-pattern #8).
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import { useSupplyTableFilters } from '../useSupplyTableFilters'
import { formatReorderValue } from '@/lib/supply-planning-utils'

function makeItem(overrides: Partial<SupplyPlanningItem> = {}): SupplyPlanningItem {
  return {
    sku_id: 'SKU',
    product_name: 'product',
    current_stock: 10,
    in_transit: 0,
    avg_daily_sales: 1,
    days_until_stockout: 10,
    reorder_quantity: 5,
    reorder_value: 0,
    ...overrides,
  } as unknown as SupplyPlanningItem
}

describe('useSupplyTableFilters — reorder_value sort with undefined (no COGS)', () => {
  it('sorts deterministically — undefined reorder_value does not NaN-scramble the order', () => {
    const data = [
      makeItem({ sku_id: 'A', reorder_value: 300 }),
      makeItem({ sku_id: 'B', reorder_value: undefined }),
      makeItem({ sku_id: 'C', reorder_value: 100 }),
      makeItem({ sku_id: 'D', reorder_value: undefined }),
      makeItem({ sku_id: 'E', reorder_value: 200 }),
    ]
    const { result } = renderHook(() => useSupplyTableFilters(data))
    act(() => result.current.handleSort('reorder_value', () => {}))

    // Defined values stay strictly ascending (the NaN bug would scramble them).
    const definedAsc = result.current.processedData
      .map(i => i.reorder_value)
      .filter((v): v is number => v != null)
    expect(definedAsc).toEqual([100, 200, 300])
    // Unknown (undefined) values are grouped together (sorted last via -Infinity → first on asc).
    const order = result.current.processedData.map(i => i.sku_id)
    expect(order.slice(0, 2).sort()).toEqual(['B', 'D'])
  })
})

describe('useSupplyTableFilters — avg_daily_sales sort with null velocity (169.13 fix F2)', () => {
  const data = [
    makeItem({ sku_id: 'A', avg_daily_sales: 5 }),
    makeItem({ sku_id: 'B', avg_daily_sales: null }),
    makeItem({ sku_id: 'C', avg_daily_sales: 1 }),
  ]

  it('null velocity sorts LAST in asc (?? Infinity — mirrors days_until_stockout ?? 9999)', () => {
    const { result } = renderHook(() => useSupplyTableFilters(data))
    act(() => result.current.handleSort('avg_daily_sales', () => {}))
    expect(result.current.processedData.map(i => i.sku_id)).toEqual(['C', 'A', 'B'])
  })

  it('null velocity sorts FIRST in desc — the comparator is direction-aware and flips nulls, exactly like days_until_stockout', () => {
    const { result } = renderHook(() => useSupplyTableFilters(data))
    act(() => result.current.handleSort('avg_daily_sales', () => {}))
    act(() => result.current.handleSort('avg_daily_sales', () => {})) // asc → desc
    expect(result.current.processedData.map(i => i.sku_id)).toEqual(['B', 'A', 'C'])
  })
})

describe('formatReorderValue', () => {
  it('renders "—" for undefined/null (no COGS), never a fabricated "0 ₽"', () => {
    expect(formatReorderValue(undefined)).toBe('—')
    expect(formatReorderValue(null)).toBe('—')
  })

  it('renders "—" for 0 (nothing to reorder — by design for this column)', () => {
    expect(formatReorderValue(0)).toBe('—')
  })

  it('formats a positive value in RUB', () => {
    expect(formatReorderValue(70000)).toMatch(/70\s*000/)
  })
})
