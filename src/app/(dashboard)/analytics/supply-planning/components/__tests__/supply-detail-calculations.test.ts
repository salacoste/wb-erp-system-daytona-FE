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
import { buildCopyInfo } from '../supply-detail-calculations'

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
