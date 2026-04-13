/**
 * TDD RED Phase Tests for Tax Display Helpers
 * Story 66.6-FE: Net Profit After Tax Display
 * Epic 66-FE: Tax & Accounting Frontend
 *
 * Tests for getNetProfit() and calculateAfterTaxMargin() helper functions.
 *
 * Business Logic:
 * - getNetProfit: cascading fallback from net_profit_after_all_tax -> net_profit_after_tax -> payoutTotal
 * - calculateAfterTaxMargin: uses revenue_excl_vat for VAT payers, sale_gross_total otherwise
 *
 * @see docs/stories/epic-66/story-66.6-fe-net-profit-card.md
 */

import { describe, it, expect } from 'vitest'
import type { TaxMetrics } from '@/types/finance-summary'
import { getNetProfit, calculateAfterTaxMargin } from '../tax-display-helpers'

// =============================================================================
// Test Factory
// =============================================================================

function createTaxMetrics(overrides?: Partial<TaxMetrics>): TaxMetrics {
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

// =============================================================================
// getNetProfit Tests
// =============================================================================

describe('getNetProfit (Story 66.6-FE)', () => {
  it('returns payout_total when tax is null and no operatingProfit', () => {
    const result = getNetProfit(null, 250000)

    expect(result.value).toBe(250000)
    expect(result.label).toBe('К перечислению')
    expect(result.isPreTax).toBe(true)
  })

  // Story 87.1-FE: operatingProfit cascade
  it('returns operatingProfit when tax is null and operatingProfit provided', () => {
    const result = getNetProfit(null, 250000, 65000)

    expect(result.value).toBe(65000)
    expect(result.label).toBe('Операционная прибыль (до налога)')
    expect(result.isPreTax).toBe(true)
  })

  it('prefers tax-adjusted profit over operatingProfit when tax configured', () => {
    const tax = createTaxMetrics({ net_profit_after_tax: 85000 })
    const result = getNetProfit(tax, 250000, 65000)

    expect(result.value).toBe(85000)
    expect(result.label).toBe('Чистая прибыль')
    expect(result.isPreTax).toBe(false)
  })

  it('falls back to operatingProfit when tax fields are null', () => {
    const tax = createTaxMetrics({
      net_profit_after_tax: null,
      net_profit_after_all_tax: null,
    })
    const result = getNetProfit(tax, 250000, 65000)

    expect(result.value).toBe(65000)
    expect(result.label).toBe('Операционная прибыль (до налога)')
    expect(result.isPreTax).toBe(true)
  })

  it('returns net_profit_after_all_tax when vat_payer and value exists', () => {
    const tax = createTaxMetrics({
      vat_payer: true,
      vat_rate: 20,
      vat_output: 40000,
      vat_payable: 30000,
      revenue_excl_vat: 160000,
      net_profit_after_all_tax: 55000,
      net_profit_after_tax: 85000,
    })

    const result = getNetProfit(tax, 250000)

    expect(result.value).toBe(55000)
    expect(result.label).toBe('Чистая прибыль')
    expect(result.isPreTax).toBe(false)
  })

  it('returns net_profit_after_tax when only income tax configured', () => {
    const tax = createTaxMetrics({
      vat_payer: false,
      net_profit_after_tax: 85000,
      net_profit_after_all_tax: null,
    })

    const result = getNetProfit(tax, 250000)

    expect(result.value).toBe(85000)
    expect(result.label).toBe('Чистая прибыль')
    expect(result.isPreTax).toBe(false)
  })

  it('falls back to payout_total when tax fields are null', () => {
    const tax = createTaxMetrics({
      net_profit_after_tax: null,
      net_profit_after_all_tax: null,
    })

    const result = getNetProfit(tax, 250000)

    expect(result.value).toBe(250000)
    expect(result.label).toBe('К перечислению')
    expect(result.isPreTax).toBe(true)
  })

  it('sets isPreTax=true when no tax configured', () => {
    const resultNull = getNetProfit(null, 100000)
    expect(resultNull.isPreTax).toBe(true)

    const taxEmpty = createTaxMetrics({
      net_profit_after_tax: null,
      net_profit_after_all_tax: null,
    })
    const resultEmpty = getNetProfit(taxEmpty, 100000)
    expect(resultEmpty.isPreTax).toBe(true)
  })

  it('sets isPreTax=false when tax configured', () => {
    const taxIncome = createTaxMetrics({ net_profit_after_tax: 85000 })
    expect(getNetProfit(taxIncome, 250000).isPreTax).toBe(false)

    const taxVat = createTaxMetrics({
      vat_payer: true,
      net_profit_after_all_tax: 55000,
    })
    expect(getNetProfit(taxVat, 250000).isPreTax).toBe(false)
  })
})

// =============================================================================
// calculateAfterTaxMargin Tests
// =============================================================================

describe('calculateAfterTaxMargin (Story 66.6-FE)', () => {
  it('uses revenue_excl_vat when vat_payer', () => {
    const tax = createTaxMetrics({
      vat_payer: true,
      revenue_excl_vat: 160000,
    })

    // netProfit=55000, revenue=160000 -> (55000/160000)*100 = 34.375
    const result = calculateAfterTaxMargin(55000, tax, 200000)

    expect(result).toBeCloseTo(34.375, 2)
  })

  it('uses sale_gross_total when no VAT', () => {
    const tax = createTaxMetrics({ vat_payer: false })

    // netProfit=85000, saleGrossTotal=200000 -> (85000/200000)*100 = 42.5
    const result = calculateAfterTaxMargin(85000, tax, 200000)

    expect(result).toBeCloseTo(42.5, 2)
  })

  it('returns null when revenue is zero', () => {
    const tax = createTaxMetrics({ vat_payer: false })

    expect(calculateAfterTaxMargin(85000, tax, 0)).toBeNull()
  })

  it('returns null when saleGrossTotal is null and not VAT payer', () => {
    const tax = createTaxMetrics({ vat_payer: false })

    expect(calculateAfterTaxMargin(85000, tax, null)).toBeNull()
  })

  it('returns null when tax is null and saleGrossTotal is null', () => {
    expect(calculateAfterTaxMargin(85000, null, null)).toBeNull()
  })

  it('returns null when revenue_excl_vat is null for VAT payer', () => {
    const tax = createTaxMetrics({
      vat_payer: true,
      revenue_excl_vat: null,
    })

    expect(calculateAfterTaxMargin(55000, tax, 200000)).toBeNull()
  })

  it('calculates correct percentage for negative net profit', () => {
    const tax = createTaxMetrics({ vat_payer: false })

    // netProfit=-15000, saleGrossTotal=200000 -> (-15000/200000)*100 = -7.5
    const result = calculateAfterTaxMargin(-15000, tax, 200000)

    expect(result).toBeCloseTo(-7.5, 2)
  })

  it('uses saleGrossTotal when tax is null', () => {
    // null tax -> not vat_payer -> falls to saleGrossTotal
    const result = calculateAfterTaxMargin(85000, null, 200000)

    expect(result).toBeCloseTo(42.5, 2)
  })
})
