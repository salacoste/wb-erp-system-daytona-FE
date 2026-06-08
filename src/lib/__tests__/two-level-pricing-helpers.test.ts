/**
 * Unit tests for two-level-pricing-helpers
 * Story 44.20-FE: Two-Level Pricing Display
 */

import { describe, it, expect } from 'vitest'
import {
  calculateFixedCosts,
  calculatePercentageCosts,
  calculateVariableCosts,
  calculateMargin,
  calculatePriceGap,
} from '../two-level-pricing-helpers'
import type { TwoLevelPricingFormData } from '@/types/price-calculator'

// ============================================================================
// Test fixtures
// ============================================================================

const baseFormData: TwoLevelPricingFormData = {
  fulfillment_type: 'FBO',
  cogs_rub: 500,
  logistics_forward_rub: 50,
  logistics_reverse_rub: 30,
  buyback_pct: 90,
  storage_rub: 10,
  acceptance_cost: 5,
  acquiring_pct: 2.5,
  drr_pct: 5,
  target_margin_pct: 20,
  tax_rate_pct: 6,
  tax_type: 'income',
  spp_pct: 0,
}

// ============================================================================
// calculateFixedCosts
// ============================================================================

describe('calculateFixedCosts', () => {
  it('calculates total fixed costs for FBO', () => {
    const result = calculateFixedCosts(baseFormData)
    expect(result.cogs).toBe(500)
    expect(result.logisticsForward).toBe(50)
    expect(result.storage).toBe(10)
    expect(result.acceptance).toBe(5)
    expect(result.total).toBeGreaterThan(0)
  })

  it('sets storage and acceptance to 0 for FBS', () => {
    const fbsData = { ...baseFormData, fulfillment_type: 'FBS' as const }
    const result = calculateFixedCosts(fbsData)
    expect(result.storage).toBe(0)
    expect(result.acceptance).toBe(0)
  })

  it('calculates reverse logistics with return rate', () => {
    const result = calculateFixedCosts(baseFormData)
    // returnRate = (100 - 90) / 100 = 0.1
    // logisticsReverseEffective = 30 * 0.1 = 3
    expect(result.logisticsReverseEffective).toBeCloseTo(3)
  })

  it('handles 100% buyback (no returns)', () => {
    const data = { ...baseFormData, buyback_pct: 100 }
    const result = calculateFixedCosts(data)
    expect(result.logisticsReverseEffective).toBe(0)
  })

  it('handles 0% buyback (all returns)', () => {
    const data = { ...baseFormData, buyback_pct: 0 }
    const result = calculateFixedCosts(data)
    expect(result.logisticsReverseEffective).toBe(30)
  })

  it('includes packaging per unit', () => {
    const data = { ...baseFormData, packaging_rub: 100, units_per_package: 10 }
    const result = calculateFixedCosts(data)
    expect(result.packaging).toBe(10) // 100 / 10
  })

  it('defaults units_per_package to 1 when undefined', () => {
    const data = { ...baseFormData, packaging_rub: 50 }
    const result = calculateFixedCosts(data)
    expect(result.packaging).toBe(50) // 50 / 1
  })

  it('handles null acceptance_cost for FBO', () => {
    const data = { ...baseFormData, acceptance_cost: undefined }
    const result = calculateFixedCosts(data)
    expect(result.acceptance).toBe(0) // toCount(null) = 0
  })

  it('includes logistics to MP per unit', () => {
    const data = {
      ...baseFormData,
      logistics_to_mp_rub: 200,
      units_per_package: 4,
    }
    const result = calculateFixedCosts(data)
    expect(result.logisticsToMp).toBe(50) // 200 / 4
  })

  it('total equals sum of all components', () => {
    const result = calculateFixedCosts(baseFormData)
    const expectedSum =
      result.cogs +
      result.logisticsForward +
      result.logisticsReverseEffective +
      result.storage +
      result.acceptance +
      result.packaging +
      result.logisticsToMp
    expect(result.total).toBeCloseTo(expectedSum)
  })
})

// ============================================================================
// calculatePercentageCosts
// ============================================================================

describe('calculatePercentageCosts', () => {
  it('calculates commission and acquiring costs', () => {
    const result = calculatePercentageCosts(1000, 15, 2.5, 6, 'income', false, 0)
    expect(result.commissionWb.pct).toBe(15)
    expect(result.commissionWb.rub).toBe(150)
    expect(result.acquiring.pct).toBe(2.5)
    expect(result.acquiring.rub).toBe(25)
  })

  it('includes income tax when tax_type is income', () => {
    const result = calculatePercentageCosts(1000, 10, 2, 6, 'income', false, 0)
    expect(result.taxIncome).not.toBeNull()
    expect(result.taxIncome!.pct).toBe(6)
    expect(result.taxIncome!.rub).toBe(60)
  })

  it('excludes income tax when tax_type is profit', () => {
    const result = calculatePercentageCosts(1000, 10, 2, 15, 'profit', false, 0)
    expect(result.taxIncome).toBeNull()
  })

  it('includes VAT when payer', () => {
    const result = calculatePercentageCosts(1000, 10, 2, 6, 'income', true, 20)
    expect(result.vat).not.toBeNull()
    expect(result.vat!.pct).toBe(20)
    expect(result.vat!.rub).toBe(200)
  })

  it('excludes VAT when not payer', () => {
    const result = calculatePercentageCosts(1000, 10, 2, 6, 'income', false, 20)
    expect(result.vat).toBeNull()
  })

  it('calculates total correctly for income tax + VAT', () => {
    const result = calculatePercentageCosts(1000, 10, 2, 6, 'income', true, 20)
    // totalPct = 10 + 2 + 6 + 20 = 38
    expect(result.total.pct).toBe(38)
    // totalRub = 100 + 20 + 60 + 200 = 380
    expect(result.total.rub).toBe(380)
  })

  it('calculates total for profit tax without income tax', () => {
    const result = calculatePercentageCosts(1000, 10, 2, 15, 'profit', false, 0)
    // totalPct = 10 + 2 (no income tax, no VAT)
    expect(result.total.pct).toBe(12)
    expect(result.total.rub).toBe(120)
  })

  it('handles zero price', () => {
    const result = calculatePercentageCosts(0, 10, 2, 6, 'income', false, 0)
    expect(result.commissionWb.rub).toBe(0)
    expect(result.acquiring.rub).toBe(0)
    expect(result.total.rub).toBe(0)
  })
})

// ============================================================================
// calculateVariableCosts
// ============================================================================

describe('calculateVariableCosts', () => {
  it('calculates DRR costs', () => {
    const result = calculateVariableCosts(1000, 5)
    expect(result.drr.pct).toBe(5)
    expect(result.drr.rub).toBe(50)
  })

  it('handles zero DRR', () => {
    const result = calculateVariableCosts(1000, 0)
    expect(result.drr.rub).toBe(0)
  })

  it('handles zero price', () => {
    const result = calculateVariableCosts(0, 10)
    expect(result.drr.rub).toBe(0)
  })

  it('total equals DRR', () => {
    const result = calculateVariableCosts(500, 8)
    expect(result.total.pct).toBe(8)
    expect(result.total.rub).toBe(40)
  })
})

// ============================================================================
// calculateMargin
// ============================================================================

describe('calculateMargin', () => {
  it('calculates gross margin for income tax', () => {
    const result = calculateMargin(1000, 20, 6, 'income')
    expect(result.pct).toBe(20)
    expect(result.rub).toBe(200)
    expect(result.afterTax).toBeNull()
  })

  it('calculates after-tax margin for profit tax', () => {
    const result = calculateMargin(1000, 20, 15, 'profit')
    expect(result.rub).toBe(200)
    expect(result.afterTax).not.toBeNull()
    // 200 * (1 - 15/100) = 200 * 0.85 = 170
    expect(result.afterTax).toBeCloseTo(170)
  })

  it('handles zero margin target', () => {
    const result = calculateMargin(1000, 0, 15, 'income')
    expect(result.rub).toBe(0)
  })

  it('handles zero price', () => {
    const result = calculateMargin(0, 20, 15, 'income')
    expect(result.rub).toBe(0)
  })
})

// ============================================================================
// calculatePriceGap
// ============================================================================

describe('calculatePriceGap', () => {
  it('calculates gap between recommended and minimum', () => {
    const result = calculatePriceGap(800, 1000)
    expect(result.rub).toBe(200)
    expect(result.pct).toBeCloseTo(25) // 200/800 * 100
  })

  it('returns zero gap when prices are equal', () => {
    const result = calculatePriceGap(1000, 1000)
    expect(result.rub).toBe(0)
    expect(result.pct).toBe(0)
  })

  it('returns negative gap when recommended < minimum', () => {
    const result = calculatePriceGap(1000, 800)
    expect(result.rub).toBe(-200)
    expect(result.pct).toBeCloseTo(-20)
  })

  it('handles zero minimum price', () => {
    const result = calculatePriceGap(0, 1000)
    expect(result.rub).toBe(1000)
    expect(result.pct).toBe(0) // division guard
  })
})
