/**
 * TDD RED PHASE: Tax Aggregation Tests
 * Story 66.4-FE: Finance Summary Tax Integration
 *
 * Tests for aggregateTaxMetrics() (new) and aggregateFinanceSummaries() (updated).
 * These tests MUST FAIL because aggregateTaxMetrics does not exist yet.
 */

import { describe, it, expect } from 'vitest'
import { aggregateFinanceSummaries, aggregateTaxMetrics } from '../aggregation'
import type { TaxMetrics, FinanceSummary } from '@/types/finance-summary'

// ============================================================================
// Factories
// ============================================================================

function createTaxMetrics(overrides?: Partial<TaxMetrics>): TaxMetrics {
  return {
    tax_amount: 87000,
    tax_base: 1450000,
    effective_tax_rate: 6.0,
    tax_system: 'usn6',
    is_minimum_rule: false,
    net_profit_after_tax: 723000,
    vat_payer: false,
    vat_rate: null,
    vat_output: null,
    vat_payable: null,
    revenue_excl_vat: null,
    net_profit_after_all_tax: null,
    ...overrides,
  }
}

function createFinanceSummary(overrides?: Partial<FinanceSummary>): FinanceSummary {
  return {
    week: '2025-W45',
    payout_total: 810000,
    penalties_total: 5000,
    sale_gross_total: 1450000,
    ...overrides,
  }
}

// ============================================================================
// aggregateTaxMetrics unit tests
// ============================================================================

describe('aggregateTaxMetrics (Story 66.4-FE)', () => {
  it('1: returns null for empty array', () => {
    expect(aggregateTaxMetrics([])).toBeNull()
  })

  it('2: single TaxMetrics passes through unchanged', () => {
    const tax = createTaxMetrics()
    const result = aggregateTaxMetrics([tax])
    expect(result).toEqual(tax)
  })

  it('3: sums income tax numeric fields across weeks', () => {
    const a = createTaxMetrics({
      tax_amount: 87000,
      tax_base: 1450000,
      net_profit_after_tax: 723000,
    })
    const b = createTaxMetrics({
      tax_amount: 63000,
      tax_base: 1050000,
      net_profit_after_tax: 537000,
    })
    const result = aggregateTaxMetrics([a, b])!

    expect(result.tax_amount).toBe(150000)
    expect(result.tax_base).toBe(2500000)
    expect(result.net_profit_after_tax).toBe(1260000)
  })

  it('4: sums VAT numeric fields across weeks', () => {
    const a = createTaxMetrics({
      vat_output: 200000,
      vat_payable: 150000,
      revenue_excl_vat: 1000000,
      net_profit_after_all_tax: 600000,
    })
    const b = createTaxMetrics({
      vat_output: 100000,
      vat_payable: 75000,
      revenue_excl_vat: 500000,
      net_profit_after_all_tax: 300000,
    })
    const result = aggregateTaxMetrics([a, b])!

    expect(result.vat_output).toBe(300000)
    expect(result.vat_payable).toBe(225000)
    expect(result.revenue_excl_vat).toBe(1500000)
    expect(result.net_profit_after_all_tax).toBe(900000)
  })

  it('5: takes effective_tax_rate from first week (not summed)', () => {
    const a = createTaxMetrics({ effective_tax_rate: 6.0 })
    const b = createTaxMetrics({ effective_tax_rate: 15.0 })
    const result = aggregateTaxMetrics([a, b])!

    expect(result.effective_tax_rate).toBe(6.0)
  })

  it('6: takes tax_system from first week', () => {
    const a = createTaxMetrics({ tax_system: 'usn6' })
    const b = createTaxMetrics({ tax_system: 'usn15' })
    const result = aggregateTaxMetrics([a, b])!

    expect(result.tax_system).toBe('usn6')
  })

  it('7: takes vat_payer and vat_rate from first week', () => {
    const a = createTaxMetrics({ vat_payer: true, vat_rate: 20 })
    const b = createTaxMetrics({ vat_payer: false, vat_rate: 5 })
    const result = aggregateTaxMetrics([a, b])!

    expect(result.vat_payer).toBe(true)
    expect(result.vat_rate).toBe(20)
  })

  it('8: is_minimum_rule true if ANY week has it true', () => {
    const a = createTaxMetrics({ is_minimum_rule: false })
    const b = createTaxMetrics({ is_minimum_rule: true })
    const c = createTaxMetrics({ is_minimum_rule: false })
    const result = aggregateTaxMetrics([a, b, c])!

    expect(result.is_minimum_rule).toBe(true)
  })

  it('9: treats null numeric values as 0 for sums', () => {
    const a = createTaxMetrics({ tax_amount: 87000, vat_output: null })
    const b = createTaxMetrics({ tax_amount: null, vat_output: 100000 })
    const result = aggregateTaxMetrics([a, b])!

    expect(result.tax_amount).toBe(87000)
    expect(result.vat_output).toBe(100000)
  })

  it('10: returns null when all inputs have null tax', () => {
    expect(aggregateTaxMetrics([null, null, null] as unknown as TaxMetrics[])).toBeNull()
  })
})

// ============================================================================
// Integration: aggregateFinanceSummaries with tax field
// ============================================================================

describe('aggregateFinanceSummaries tax integration (Story 66.4-FE)', () => {
  it('11: single week with tax passes through in result', () => {
    const tax = createTaxMetrics()
    const summary = createFinanceSummary({ tax })
    const result = aggregateFinanceSummaries([summary])

    expect(result).not.toBeNull()
    expect(result!.tax).toEqual(tax)
  })

  it('12: multiple weeks with tax aggregates tax fields', () => {
    const s1 = createFinanceSummary({
      week: '2025-W45',
      tax: createTaxMetrics({ tax_amount: 87000, net_profit_after_tax: 723000 }),
    })
    const s2 = createFinanceSummary({
      week: '2025-W46',
      tax: createTaxMetrics({ tax_amount: 63000, net_profit_after_tax: 537000 }),
    })
    const result = aggregateFinanceSummaries([s1, s2])

    expect(result).not.toBeNull()
    expect(result!.tax).not.toBeNull()
    expect(result!.tax!.tax_amount).toBe(150000)
    expect(result!.tax!.net_profit_after_tax).toBe(1260000)
  })

  it('13: all weeks without tax yields null aggregated tax', () => {
    const s1 = createFinanceSummary({ week: '2025-W45', tax: null })
    const s2 = createFinanceSummary({ week: '2025-W46', tax: undefined })
    const result = aggregateFinanceSummaries([s1, s2])

    expect(result).not.toBeNull()
    expect(result!.tax).toBeNull()
  })

  it('14: mixed weeks aggregates only non-null tax entries', () => {
    const s1 = createFinanceSummary({
      week: '2025-W45',
      tax: createTaxMetrics({ tax_amount: 87000, is_minimum_rule: true }),
    })
    const s2 = createFinanceSummary({ week: '2025-W46', tax: null })
    const s3 = createFinanceSummary({
      week: '2025-W47',
      tax: createTaxMetrics({ tax_amount: 63000, is_minimum_rule: false }),
    })
    const result = aggregateFinanceSummaries([s1, s2, s3])

    expect(result).not.toBeNull()
    expect(result!.tax).not.toBeNull()
    // Only W45 + W47 aggregated (W46 is null, skipped)
    expect(result!.tax!.tax_amount).toBe(150000)
    expect(result!.tax!.is_minimum_rule).toBe(true)
  })
})
