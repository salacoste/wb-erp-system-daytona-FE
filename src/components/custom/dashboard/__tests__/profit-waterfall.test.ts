/**
 * Unit tests for buildProfitWaterfall (TZ-2 P&L chain model).
 * Verifies row ordering, sign convention, subtotal/margin flags, null handling,
 * and the commissions aggregation.
 */

import { describe, it, expect } from 'vitest'
import { buildProfitWaterfall, type ProfitWaterfallInput } from '../profit-waterfall'

const fullInput: ProfitWaterfallInput = {
  revenue: 100000,
  cogs: 30000,
  gross: 70000,
  logistics: 8000,
  storage: 2000,
  commissionsComponents: [10000, 500, 200, 100, 50],
  operating: 49200,
  tax: 8000,
  net: 41200,
  grossMarginPct: 70,
  marginPct: 41.2,
}

describe('buildProfitWaterfall', () => {
  it('returns the 11 rows in P&L order', () => {
    const rows = buildProfitWaterfall(fullInput)
    expect(rows.map(r => r.id)).toEqual([
      'revenue',
      'cogs',
      'gross',
      'logistics',
      'storage',
      'commissions',
      'operating',
      'tax',
      'net',
      'grossMargin',
      'margin',
    ])
  })

  it('assigns signs: revenue +, deductions −, subtotals =', () => {
    const byId = Object.fromEntries(buildProfitWaterfall(fullInput).map(r => [r.id, r.sign]))
    expect(byId.revenue).toBe('+')
    expect(byId.cogs).toBe('-')
    expect(byId.gross).toBe('=')
    expect(byId.logistics).toBe('-')
    expect(byId.storage).toBe('-')
    expect(byId.commissions).toBe('-')
    expect(byId.operating).toBe('=')
    expect(byId.tax).toBe('-')
    expect(byId.net).toBe('=')
  })

  it('flags only gross/operating/net as emphasis subtotals', () => {
    const rows = buildProfitWaterfall(fullInput)
    const emphasized = rows.filter(r => r.emphasis).map(r => r.id)
    expect(emphasized).toEqual(['gross', 'operating', 'net'])
  })

  it('flags only the two margin rows as percentages', () => {
    const rows = buildProfitWaterfall(fullInput)
    const pct = rows.filter(r => r.isPercentage).map(r => r.id)
    expect(pct).toEqual(['grossMargin', 'margin'])
  })

  it('sums the commissions components into one row', () => {
    const rows = buildProfitWaterfall(fullInput)
    const commissions = rows.find(r => r.id === 'commissions')
    // 10000 + 500 + 200 + 100 + 50 = 10850
    expect(commissions?.value).toBe(10850)
  })

  it('returns null commissions when no component is present', () => {
    const rows = buildProfitWaterfall({
      ...fullInput,
      commissionsComponents: [undefined, undefined],
    })
    expect(rows.find(r => r.id === 'commissions')?.value).toBeNull()
  })

  it('sums only the defined commission components (partial data)', () => {
    const rows = buildProfitWaterfall({
      ...fullInput,
      commissionsComponents: [10000, undefined, 200, undefined, undefined],
    })
    expect(rows.find(r => r.id === 'commissions')?.value).toBe(10200)
  })

  it('preserves null for missing scalar values (undefined → null)', () => {
    const rows = buildProfitWaterfall({
      ...fullInput,
      revenue: undefined,
      cogs: undefined,
      tax: undefined,
      grossMarginPct: undefined,
    })
    expect(rows.find(r => r.id === 'revenue')?.value).toBeNull()
    expect(rows.find(r => r.id === 'cogs')?.value).toBeNull()
    expect(rows.find(r => r.id === 'tax')?.value).toBeNull()
    expect(rows.find(r => r.id === 'grossMargin')?.value).toBeNull()
  })

  it('passes through provided scalar values', () => {
    const rows = buildProfitWaterfall(fullInput)
    expect(rows.find(r => r.id === 'revenue')?.value).toBe(100000)
    expect(rows.find(r => r.id === 'net')?.value).toBe(41200)
    expect(rows.find(r => r.id === 'margin')?.value).toBe(41.2)
  })
})
