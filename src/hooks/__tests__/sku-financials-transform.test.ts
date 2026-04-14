/**
 * Unit tests for SKU financials transform
 * Story 87.3-FE: Ensure null is preserved when backend omits profit/cogs,
 * preventing misleading "0 ₽" display in SKU analytics.
 */

import { describe, it, expect } from 'vitest'
import { transformBackendItem } from '../sku-financials-transform'
import type { BackendSkuItem } from '../sku-financials-types'

function makeBackendItem(overrides: Partial<BackendSkuItem> = {}): BackendSkuItem {
  return {
    nm_id: '123',
    sa_name: 'Test Product',
    category: 'cat',
    brand: 'brand',
    sales: { quantity: 10, revenue_gross: 10000, revenue_net: 9000 },
    returns: { quantity: 1, revenue_gross: 1000, revenue_net: 900 },
    cogs: { unit_cost: 400, total: 4000, source: 'manual', valid_from: '2026-01-01' },
    expenses: {
      logistics_total: 500,
      storage: 100,
      penalties: 0,
      paid_acceptance: 50,
      other_adjustments: 0,
    },
    gross_profit: 5000,
    operating_profit: 4350,
    operating_margin_pct: 48.3,
    profitability_status: 'profitable',
    ...overrides,
  } as BackendSkuItem
}

describe('transformBackendItem — Story 87.3-FE null preservation', () => {
  it('preserves null for profit.gross when backend omits gross_profit', () => {
    const item = makeBackendItem({ gross_profit: null as unknown as number })
    const result = transformBackendItem(item)
    expect(result.profit.gross).toBe(null)
  })

  it('preserves null for profit.operating when backend omits operating_profit', () => {
    const item = makeBackendItem({ operating_profit: null as unknown as number })
    const result = transformBackendItem(item)
    expect(result.profit.operating).toBe(null)
  })

  it('preserves null for profit.operatingMarginPct when backend omits operating_margin_pct', () => {
    const item = makeBackendItem({ operating_margin_pct: null as unknown as number })
    const result = transformBackendItem(item)
    expect(result.profit.operatingMarginPct).toBe(null)
  })

  it('sets missingCogs=true when cogs is null', () => {
    const item = makeBackendItem({ cogs: null })
    const result = transformBackendItem(item)
    expect(result.missingCogs).toBe(true)
    expect(result.costs.cogs).toBe(null)
  })

  it('preserves legitimate zero values (not converted to null)', () => {
    const item = makeBackendItem({ gross_profit: 0, operating_profit: 0 })
    const result = transformBackendItem(item)
    expect(result.profit.gross).toBe(0)
    expect(result.profit.operating).toBe(0)
  })

  it('passes through non-null values', () => {
    const item = makeBackendItem({ gross_profit: 5000, operating_profit: 4350 })
    const result = transformBackendItem(item)
    expect(result.profit.gross).toBe(5000)
    expect(result.profit.operating).toBe(4350)
  })
})
