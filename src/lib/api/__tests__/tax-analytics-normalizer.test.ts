/**
 * Boundary Normalizer Tests — Tax Analytics
 */

import { describe, it, expect } from 'vitest'
import { normalizePreliminaryTaxResponse } from '../tax-analytics-normalizer'

describe('normalizePreliminaryTaxResponse', () => {
  const fullRaw = {
    tax: {
      tax_amount: 15000,
      tax_base: 100000,
      effective_tax_rate: 0.15,
      tax_system: 'usn6',
      is_minimum_rule: false,
      net_profit_after_tax: 85000,
      vat_payer: false,
      vat_rate: null,
      vat_output: null,
      vat_payable: null,
      revenue_excl_vat: null,
      net_profit_after_all_tax: 85000,
      preliminary: true,
      data_completeness: {
        revenueSource: 'orders',
        hasLogistics: true,
        hasStorage: true,
        hasAcceptance: true,
        hasPenalties: false,
        hasCogs: true,
        hasAdvertising: true,
      },
    },
  }

  it('maps full tax response', () => {
    const result = normalizePreliminaryTaxResponse(fullRaw)
    expect(result.tax).not.toBeNull()
    expect(result.tax!.tax_amount).toBe(15000)
    expect(result.tax!.tax_system).toBe('usn6')
    expect(result.tax!.preliminary).toBe(true)
    expect(result.tax!.data_completeness?.revenueSource).toBe('orders')
  })

  it('handles null tax', () => {
    const result = normalizePreliminaryTaxResponse({ tax: null })
    expect(result.tax).toBeNull()
  })

  it('handles null input', () => {
    const result = normalizePreliminaryTaxResponse(null)
    expect(result.tax).toBeNull()
  })

  it('handles missing tax fields — money/ratio fields default to null', () => {
    const result = normalizePreliminaryTaxResponse({ tax: {} })
    expect(result.tax).not.toBeNull()
    expect(result.tax!.tax_amount).toBeNull()
    expect(result.tax!.effective_tax_rate).toBeNull()
    expect(result.tax!.vat_rate).toBeNull()
    expect(result.tax!.vat_payer).toBe(false)
    expect(result.tax!.is_minimum_rule).toBe(false)
  })

  it('handles missing data_completeness', () => {
    const result = normalizePreliminaryTaxResponse({ tax: { tax_amount: 100 } })
    expect(result.tax!.data_completeness).toBeUndefined()
  })
})
