/**
 * unit-economics normalizer — Validation F-43.
 * Pins the backend→FE item field mapping: quantity_sold→units_sold,
 * missing_cogs→has_cogs (inverted). FE-canonical names win when already present.
 */

import { describe, it, expect } from 'vitest'
import { normalizeUnitEconomicsResponse } from '../unit-economics-normalizer'
import type { UnitEconomicsResponse } from '@/types/unit-economics'

function build(item: Record<string, unknown>): UnitEconomicsResponse {
  return {
    meta: {},
    summary: {},
    data: [item],
  } as unknown as UnitEconomicsResponse
}

describe('normalizeUnitEconomicsResponse — F-43 field mapping', () => {
  it('maps backend quantity_sold → units_sold', () => {
    const res = normalizeUnitEconomicsResponse(build({ sku_id: 's', quantity_sold: 42 }))
    expect(res.data[0].units_sold).toBe(42)
  })

  it('maps backend missing_cogs → has_cogs (inverted)', () => {
    expect(normalizeUnitEconomicsResponse(build({ missing_cogs: true })).data[0].has_cogs).toBe(
      false
    )
    expect(normalizeUnitEconomicsResponse(build({ missing_cogs: false })).data[0].has_cogs).toBe(
      true
    )
    // absent missing_cogs → treated as has_cogs (not missing)
    expect(normalizeUnitEconomicsResponse(build({ sku_id: 's' })).data[0].has_cogs).toBe(true)
  })

  it('prefers the FE-canonical names when the backend already sends them', () => {
    const res = normalizeUnitEconomicsResponse(
      build({ units_sold: 7, quantity_sold: 99, has_cogs: false, missing_cogs: false })
    )
    expect(res.data[0].units_sold).toBe(7)
    expect(res.data[0].has_cogs).toBe(false)
  })

  it('preserves all other fields untouched + handles malformed data', () => {
    const res = normalizeUnitEconomicsResponse(
      build({ sku_id: 'x', revenue: 100, net_profit: -5, profitability_status: 'loss' })
    )
    expect(res.data[0]).toMatchObject({
      sku_id: 'x',
      revenue: 100,
      net_profit: -5,
      profitability_status: 'loss',
    })
    expect(
      normalizeUnitEconomicsResponse({ meta: {}, summary: {} } as unknown as UnitEconomicsResponse)
        .data
    ).toEqual([])
  })
})
