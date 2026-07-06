/**
 * Unit tests for getSummaryValue — BD-5 (cogs-absent guard).
 * When `cogs_total === 0` (COGS unassigned for the period), profit collapses to
 * revenue and margin to 100%; the helper must return null so the card renders «—».
 */
import { describe, it, expect } from 'vitest'
import { getSummaryValue } from '../periodComparisonFinancialHelpers'
import type { FinanceSummary } from '@/types/finance-summary'

describe('getSummaryValue — BD-5 cogs-absent guard', () => {
  it('returns profit + margin when COGS is assigned (cogs_total > 0)', () => {
    const s = {
      cogs_total: 54020,
      operating_profit_analytical: 126751,
      operating_margin_pct: 71.66,
      sale_gross_total: 620333.59,
    } as FinanceSummary
    expect(getSummaryValue(s, 'profit')).toBe(126751)
    expect(getSummaryValue(s, 'margin_pct')).toBe(71.66)
  })

  it('returns null for profit + margin when cogs_total === 0 (degenerate)', () => {
    // Live W26 shape: cogs=0, operating_profit_analytical == revenue_net, margin 100%.
    const s = {
      cogs_total: 0,
      operating_profit_analytical: 440094,
      margin_pct: 100,
    } as FinanceSummary
    expect(getSummaryValue(s, 'profit')).toBeNull()
    expect(getSummaryValue(s, 'margin_pct')).toBeNull()
  })

  it('returns null for profit + margin when cogs_total is null/absent', () => {
    const s = {
      operating_profit_analytical: 440094,
      margin_pct: 100,
    } as FinanceSummary
    expect(getSummaryValue(s, 'profit')).toBeNull()
    expect(getSummaryValue(s, 'margin_pct')).toBeNull()
  })

  it('revenue / orders / logistics are unaffected by cogs absence', () => {
    const s = {
      cogs_total: 0,
      sale_gross_total: 620333.59,
      product_transactions_total: 186,
      logistics_cost_total: 74634.81,
    } as FinanceSummary
    expect(getSummaryValue(s, 'revenue')).toBe(620333.59)
    expect(getSummaryValue(s, 'orders')).toBe(186)
    expect(getSummaryValue(s, 'logistics')).toBe(74634.81)
  })
})
