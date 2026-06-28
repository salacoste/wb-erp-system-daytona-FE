/**
 * Unit tests for the finance-history row schema (pure logic).
 * Covers value extraction, fallback chains, ratio guards, and grouping.
 */

import { describe, it, expect } from 'vitest'
import {
  FINANCE_HISTORY_ROWS,
  FINANCE_HISTORY_SECTIONS,
  rowsForSection,
  resolveRevenue,
  resolveNetProfit,
  ratio,
} from '../finance-history-rows'
import type { FinanceSummary, TaxMetrics } from '@/types/finance-summary'

function createTaxMetrics(overrides: Partial<TaxMetrics> = {}): TaxMetrics {
  return {
    tax_amount: 15000,
    tax_base: 100000,
    effective_tax_rate: 15,
    tax_system: 'usn15',
    is_minimum_rule: false,
    net_profit_after_tax: 85000,
    vat_payer: false,
    vat_rate: null,
    vat_output: null,
    vat_payable: null,
    revenue_excl_vat: null,
    net_profit_after_all_tax: null,
    ...overrides,
  }
}

function makeSummary(overrides: Partial<FinanceSummary> = {}): FinanceSummary {
  return {
    week: '2026-W10',
    payout_total: 100000,
    penalties_total: 0,
    sale_gross_total: 500000,
    returns_gross_total: 50000,
    cogs_total: 200000,
    gross_profit_analytical: 300000,
    operating_profit_analytical: 150000,
    gross_margin_pct: 60,
    operating_margin_pct: 30,
    logistics_cost_total: 80000,
    storage_cost_total: 10000,
    total_commission_rub_total: 70000,
    wb_promotion_cost_total: 30000,
    ...overrides,
  } as unknown as FinanceSummary
}

describe('resolveRevenue', () => {
  it('prefers sale_gross_total', () => {
    expect(
      resolveRevenue(makeSummary({ sale_gross_total: 500000, sale_gross: 1, revenue_net: 2 }))
    ).toBe(500000)
  })

  it('falls back to sale_gross then revenue_net', () => {
    expect(resolveRevenue(makeSummary({ sale_gross_total: undefined, sale_gross: 410000 }))).toBe(
      410000
    )
    expect(
      resolveRevenue(
        makeSummary({ sale_gross_total: undefined, sale_gross: undefined, revenue_net: 390000 })
      )
    ).toBe(390000)
  })

  it('returns null when no revenue field present', () => {
    expect(
      resolveRevenue(
        makeSummary({ sale_gross_total: undefined, sale_gross: undefined, revenue_net: undefined })
      )
    ).toBeNull()
  })
})

describe('ratio', () => {
  it('computes part/whole×100', () => {
    expect(ratio(25, 100)).toBe(25)
    expect(ratio(80000, 500000)).toBe(16)
  })

  it('is null on undefined part or whole', () => {
    expect(ratio(null, 100)).toBeNull()
    expect(ratio(10, null)).toBeNull()
    expect(ratio(undefined, undefined)).toBeNull()
  })

  it('is null on divide-by-zero (no revenue)', () => {
    expect(ratio(10, 0)).toBeNull()
  })
})

describe('resolveNetProfit', () => {
  it('uses after-tax net when tax configured', () => {
    const s = makeSummary({
      tax: createTaxMetrics({ tax_amount: 20000, net_profit_after_tax: 120000 }),
    })
    expect(resolveNetProfit(s)).toBe(120000)
  })

  it('falls back to operating profit when no tax', () => {
    expect(resolveNetProfit(makeSummary({ tax: null }))).toBe(150000)
  })

  it('last resort falls back to payout_total, NEVER gross_profit (Gross > Operating > Net)', () => {
    // gross_profit (rev−COGS) is LARGER than operating profit; using it as the
    // operating slot would inflate "net profit" (Story 87.1-FE hierarchy bug).
    const s = makeSummary({
      operating_profit_analytical: undefined,
      gross_profit: 999999,
      tax: null,
      payout_total: 77000,
    })
    expect(resolveNetProfit(s)).toBe(77000)
    expect(resolveNetProfit(s)).not.toBe(999999)
  })
})

describe('row extraction', () => {
  it('expense-share rows recompute from absolutes vs net revenue', () => {
    const s = makeSummary() // revenue 500000
    const logisticsShare = FINANCE_HISTORY_ROWS.find(r => r.id === 'logistics_share')!
    expect(logisticsShare.extract(s)).toBe(16) // 80000/500000×100
    const promotionShare = FINANCE_HISTORY_ROWS.find(r => r.id === 'promotion_share')!
    expect(promotionShare.extract(s)).toBe(6) // 30000/500000×100
  })

  it('expense-share is null when revenue is zero', () => {
    const s = makeSummary({ sale_gross_total: 0 })
    const storageShare = FINANCE_HISTORY_ROWS.find(r => r.id === 'storage_share')!
    expect(storageShare.extract(s)).toBeNull()
  })

  it('gross margin prefers precomputed analytical field', () => {
    const s = makeSummary({ gross_margin_pct: 42 })
    const row = FINANCE_HISTORY_ROWS.find(r => r.id === 'gross_margin_pct')!
    expect(row.extract(s)).toBe(42)
  })

  it('gross margin recomputes from revenue_net (not sale_gross) when precomputed field missing', () => {
    const s = makeSummary({
      gross_margin_pct: undefined,
      gross_profit_analytical: 200000,
      revenue_net: 400000,
      sale_gross_total: 500000, // would yield 40 if (wrongly) used as denominator
    })
    const row = FINANCE_HISTORY_ROWS.find(r => r.id === 'gross_margin_pct')!
    expect(row.extract(s)).toBe(50) // 200000/400000×100 — proves revenue_net denominator
  })

  it('tax row reads tax_amount', () => {
    const s = makeSummary({
      tax: createTaxMetrics({ tax_amount: 18000 }),
    })
    const row = FINANCE_HISTORY_ROWS.find(r => r.id === 'tax')!
    expect(row.extract(s)).toBe(18000)
  })

  it('returns row reads returns_gross_total', () => {
    const s = makeSummary({ returns_gross_total: 55000 })
    const row = FINANCE_HISTORY_ROWS.find(r => r.id === 'returns')!
    expect(row.extract(s)).toBe(55000)
  })
})

describe('schema integrity', () => {
  it('every row references a real section', () => {
    const sectionIds = new Set(FINANCE_HISTORY_SECTIONS.map(s => s.id))
    for (const row of FINANCE_HISTORY_ROWS) {
      expect(sectionIds.has(row.section)).toBe(true)
    }
  })

  it('every row id is unique', () => {
    const ids = FINANCE_HISTORY_ROWS.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('rowsForSection returns only that section in declaration order', () => {
    const profit = rowsForSection('profit')
    expect(profit.map(r => r.id)).toEqual([
      'cogs',
      'gross_profit',
      'gross_margin_pct',
      'operating_profit',
      'operating_margin_pct',
      'net_profit',
    ])
  })

  it('every section has at least one row', () => {
    for (const section of FINANCE_HISTORY_SECTIONS) {
      expect(rowsForSection(section.id).length).toBeGreaterThan(0)
    }
  })
})
