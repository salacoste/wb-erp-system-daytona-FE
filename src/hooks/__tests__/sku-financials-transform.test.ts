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

describe('transformBackendItem — FR-2..FR-5 parity mapping (#219)', () => {
  it('maps backend snake_case parity fields to item.parity camelCase', () => {
    const item = makeBackendItem({
      advertising_cost: 246.1,
      drr_pct: 17.39,
      ad_cost_per_unit: 12.3,
      tax_allocated: 84.91,
      net_profit_after_tax: 516.55,
      net_margin_after_tax_pct: 12.34,
      spp_rub: 548.95,
      spp_pct: 26.07,
      cancellations_qty: 2,
      stock_fbs: 530,
      stock_fbo: null,
      stock_total: 530,
      stock_value_rub: 54060,
      stock_value_share_pct: 7.5,
    })
    const result = transformBackendItem(item)
    expect(result.parity).toEqual({
      advertisingCost: 246.1,
      drrPct: 17.39,
      adCostPerUnit: 12.3,
      taxAllocated: 84.91,
      netProfitAfterTax: 516.55,
      netMarginAfterTaxPct: 12.34,
      sppRub: 548.95,
      sppPct: 26.07,
      cancellationsQty: 2,
      stockFbs: 530,
      stockFbo: null,
      stockTotal: 530,
      stockValueRub: 54060,
      stockValueSharePct: 7.5,
    })
  })

  it('preserves null for unavailable parity fields (never ?? 0)', () => {
    const item = makeBackendItem({
      advertising_cost: null,
      drr_pct: null,
      net_profit_after_tax: null,
      spp_rub: null,
      cancellations_qty: null,
      stock_value_rub: null,
      stock_value_share_pct: null,
    })
    const result = transformBackendItem(item)
    expect(result.parity?.advertisingCost).toBe(null)
    expect(result.parity?.drrPct).toBe(null)
    expect(result.parity?.netProfitAfterTax).toBe(null)
    expect(result.parity?.sppRub).toBe(null)
    expect(result.parity?.cancellationsQty).toBe(null)
    expect(result.parity?.stockValueRub).toBe(null)
    expect(result.parity?.stockValueSharePct).toBe(null)
  })

  it('omits parity entirely when backend sends no FR fields (flags off)', () => {
    const result = transformBackendItem(makeBackendItem())
    expect(result.parity).toBeUndefined()
  })

  it('preserves legitimate zero parity values (not converted to null)', () => {
    const item = makeBackendItem({
      advertising_cost: 0,
      drr_pct: 0,
      cancellations_qty: 0,
      stock_value_share_pct: 0,
    })
    const result = transformBackendItem(item)
    expect(result.parity?.advertisingCost).toBe(0)
    expect(result.parity?.drrPct).toBe(0)
    expect(result.parity?.cancellationsQty).toBe(0)
    expect(result.parity?.stockValueSharePct).toBe(0)
  })
})
