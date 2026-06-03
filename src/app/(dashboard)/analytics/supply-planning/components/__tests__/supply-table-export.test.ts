/**
 * Tests for buildSupplyTableCsv.
 *
 * Regression: the "Дней до стокаута" column rendered `days_until_stockout ?? 'N/A'`, leaking
 * an English "N/A" into a Russian-locale export. A null now exports as an EMPTY cell; the
 * 999 "never stocks out" sentinel exports as the raw number (numeric column, sortable).
 */

import { describe, it, expect } from 'vitest'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import { buildSupplyTableCsv } from '../supply-table-export'

function makeItem(overrides: Partial<SupplyPlanningItem> = {}): SupplyPlanningItem {
  return {
    stockout_risk: 'healthy',
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

describe('buildSupplyTableCsv', () => {
  it('exports an empty cell (not English "N/A") for a null days-until-stockout', () => {
    const csv = buildSupplyTableCsv([makeItem({ days_until_stockout: null })])
    expect(csv).not.toContain('N/A')
    // "Дней до стокаута" is column index 6 (0-based) — assert that exact cell is empty,
    // robust to neighbouring-column changes (the mock values contain no commas).
    const dataRow = csv.split('\n')[1].split(',')
    expect(dataRow[6]).toBe('""')
  })

  it('exports the raw numeric value (incl the 999 sentinel) for spreadsheet sorting', () => {
    const csv = buildSupplyTableCsv([makeItem({ days_until_stockout: 999 })])
    expect(csv.split('\n')[1].split(',')[6]).toBe('"999"')
  })

  it('exports an ordinary positive days value as-is', () => {
    const csv = buildSupplyTableCsv([makeItem({ days_until_stockout: 14 })])
    expect(csv.split('\n')[1].split(',')[6]).toBe('"14"')
  })

  it('includes the Russian header row', () => {
    const csv = buildSupplyTableCsv([makeItem()])
    expect(csv.split('\n')[0]).toContain('Дней до стокаута')
  })
})
