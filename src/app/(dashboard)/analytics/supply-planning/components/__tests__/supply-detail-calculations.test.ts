/**
 * Tests for buildCopyInfo (supply-detail-calculations).
 *
 * Regression: the clipboard summary rendered raw `${days_until_stockout ?? 'N/A'}`, so the
 * 999 "never stocks out" sentinel leaked as "Дней до стокаута: 999" (UI shows "∞") and null
 * gave English "N/A" instead of localized "Нет данных". Now routed through
 * formatDaysUntilStockout, consistent with the table/detail display.
 */

import { describe, it, expect } from 'vitest'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import {
  buildCopyInfo,
  calculateForecast,
  calculateTotalLostUnits,
} from '../supply-detail-calculations'

function makeItem(overrides: Partial<SupplyPlanningItem> = {}): SupplyPlanningItem {
  return {
    sku_id: '721654518',
    product_name: 'sp60pro',
    current_stock: 16,
    in_transit: 0,
    avg_daily_sales: 0,
    days_until_stockout: 999,
    reorder_quantity: 0,
    reorder_value: 0,
    ...overrides,
  } as unknown as SupplyPlanningItem
}

describe('buildCopyInfo — days until stockout', () => {
  it('renders the 999 sentinel as "∞", not the raw "999"', () => {
    const text = buildCopyInfo(makeItem({ days_until_stockout: 999 }))
    expect(text).toContain('Дней до стокаута: ∞')
    expect(text).not.toContain('Дней до стокаута: 999')
  })

  it('renders null as localized "Нет данных", not "N/A"', () => {
    const text = buildCopyInfo(makeItem({ days_until_stockout: null }))
    expect(text).toContain('Дней до стокаута: Нет данных')
    expect(text).not.toContain('Дней до стокаута: N/A')
  })

  it('renders a normal value with Russian grammar', () => {
    expect(buildCopyInfo(makeItem({ days_until_stockout: 10 }))).toContain(
      'Дней до стокаута: 10 дней'
    )
    expect(buildCopyInfo(makeItem({ days_until_stockout: 1 }))).toContain(
      'Дней до стокаута: 1 день'
    )
  })
})

describe('calculateForecast / calculateTotalLostUnits — lost UNITS, not a fabricated ₽', () => {
  it('reports zero lost units when stock covers the whole 7-day horizon', () => {
    const forecast = calculateForecast(makeItem({ current_stock: 100, avg_daily_sales: 5 }))
    expect(forecast).toHaveLength(7)
    expect(forecast.every(d => d.lostUnits === 0 && !d.isStockout)).toBe(true)
    expect(calculateTotalLostUnits(forecast)).toBe(0)
  })

  it('sums unmet demand in UNITS once stock runs out (no price multiplier)', () => {
    // stock 10, sells 5/day: depletes exactly end of day 2; days 3-7 each lose the full 5 units.
    const forecast = calculateForecast(makeItem({ current_stock: 10, avg_daily_sales: 5 }))
    const total = calculateTotalLostUnits(forecast)
    expect(total).toBe(25) // 5 stockout days × 5 units — a UNIT count, not 25×fabricated-price
    // Sanity: the value is small (units), never inflated by a ~1000₽ / cogs×2.5 markup.
    expect(total).toBeLessThan(1000)
  })

  it('counts only the unmet portion on the first stockout day', () => {
    // stock 12, sells 5/day: day 3 starts with 2 → loses 3; days 4-7 lose 5 each = 3 + 20 = 23.
    const forecast = calculateForecast(makeItem({ current_stock: 12, avg_daily_sales: 5 }))
    expect(calculateTotalLostUnits(forecast)).toBe(23)
  })

  it('reports no lost units when there are no sales (avg_daily_sales = 0)', () => {
    const forecast = calculateForecast(makeItem({ current_stock: 10, avg_daily_sales: 0 }))
    expect(forecast.every(d => d.lostUnits === 0 && !d.isStockout)).toBe(true)
    expect(calculateTotalLostUnits(forecast)).toBe(0)
  })

  it('does not fabricate losses from COGS — lost units are independent of cogs_per_unit', () => {
    const withCogs = calculateTotalLostUnits(
      calculateForecast(
        makeItem({ current_stock: 10, avg_daily_sales: 5, has_cogs: true, cogs_per_unit: 999 })
      )
    )
    const withoutCogs = calculateTotalLostUnits(
      calculateForecast(
        makeItem({ current_stock: 10, avg_daily_sales: 5, has_cogs: false, cogs_per_unit: null })
      )
    )
    expect(withCogs).toBe(withoutCogs) // 25 either way — COGS no longer leaks into the figure
  })
})
