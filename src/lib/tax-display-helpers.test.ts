import { describe, it, expect } from 'vitest'
import { getNetProfit, isNetProfitConsistent } from './tax-display-helpers'
import type { TaxMetrics } from '@/types/finance-summary'

const tax = (over: Partial<TaxMetrics> = {}): TaxMetrics =>
  ({
    vat_payer: false,
    net_profit_after_tax: null,
    net_profit_after_all_tax: null,
    ...over,
  }) as TaxMetrics

describe('getNetProfit', () => {
  it('prefers net_profit_after_all_tax for a VAT payer', () => {
    const r = getNetProfit(tax({ vat_payer: true, net_profit_after_all_tax: 100 }), 0, 50)
    expect(r.value).toBe(100)
    expect(r.label).toBe('Чистая прибыль')
    expect(r.isPreTax).toBe(false)
  })

  it('falls back to operating profit when no tax configured', () => {
    const r = getNetProfit(null, 0, 42)
    expect(r.value).toBe(42)
    expect(r.isPreTax).toBe(true)
  })

  it('last resort: payout total (cash flow, not profit)', () => {
    const r = getNetProfit(null, 9, null)
    expect(r.value).toBe(9)
    expect(r.label).toBe('К перечислению')
  })
})

describe('isNetProfitConsistent', () => {
  it('true when net ≤ operating', () => {
    expect(isNetProfitConsistent(50, 100)).toBe(true)
  })

  it('true when operating profit is unknown', () => {
    expect(isNetProfitConsistent(50, null)).toBe(true)
    expect(isNetProfitConsistent(50, undefined)).toBe(true)
  })

  it('FALSE when net exceeds operating (impossible — backend anomaly)', () => {
    // The live W25 case: net 445 588 > operating −11 584 (request-backend/213)
    expect(isNetProfitConsistent(445588.51, -11584.91)).toBe(false)
  })

  it('respects kopeck rounding tolerance', () => {
    expect(isNetProfitConsistent(100.003, 100)).toBe(true)
    expect(isNetProfitConsistent(100.01, 100)).toBe(false)
  })

  it('FALSE when after-all-tax exceeds after-tax (backwards)', () => {
    const t = tax({ net_profit_after_tax: 303878.81, net_profit_after_all_tax: 445588.51 })
    // net (50) ≤ operating (500k) ok, but after-all-tax > after-tax
    expect(isNetProfitConsistent(50, 500000, t)).toBe(false)
  })

  it('true when both invariants hold', () => {
    const t = tax({ net_profit_after_tax: 300, net_profit_after_all_tax: 250 })
    expect(isNetProfitConsistent(250, 500, t)).toBe(true)
  })
})
