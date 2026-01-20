/**
 * Unit tests for two-level pricing calculation utilities
 * Story 44.20-FE: Two-Level Pricing Display
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect } from 'vitest'
import {
  calculateTwoLevelPricing,
  getPriceGapColor,
  getPriceGapBgColor,
  isTightMargin,
  calculateCostPercentage,
} from '../two-level-pricing'
import type { TwoLevelPricingFormData } from '@/types/price-calculator'

// ============================================================================
// Test Data
// ============================================================================

/** Standard test case from requirements */
const standardFormData: TwoLevelPricingFormData = {
  fulfillment_type: 'FBO',
  cogs_rub: 500,
  logistics_forward_rub: 120,
  logistics_reverse_rub: 180,
  buyback_pct: 80, // 20% return rate
  storage_rub: 25,
  acceptance_cost: 19,
  acquiring_pct: 1.5,
  drr_pct: 5,
  target_margin_pct: 15,
  tax_rate_pct: 6,
  tax_type: 'income',
  spp_pct: 10,
}

/** FBS form data (no storage/acceptance) */
const fbsFormData: TwoLevelPricingFormData = {
  ...standardFormData,
  fulfillment_type: 'FBS',
  storage_rub: 50, // Should be ignored for FBS
  acceptance_cost: 25, // Should be ignored for FBS
}


describe('calculateTwoLevelPricing', () => {
  describe('Minimum Price Calculation', () => {
    it('should calculate minimum price as floor with 0% margin', () => {
      const result = calculateTwoLevelPricing(standardFormData, 15)

      // Minimum price = fixed_costs / (1 - min_pct_rate)
      // min_pct_rate = commission(15%) + acquiring(1.5%) + tax(6%) = 22.5%
      // fixed_costs = 500 + 120 + (180*0.2) + 25 + 19 = 700
      // minimum = 700 / (1 - 0.225) = 700 / 0.775 ≈ 903.23
      expect(result.minimumPrice).toBeCloseTo(903.23, 1)
    })

    it('should include all fixed costs in minimum price', () => {
      const result = calculateTwoLevelPricing(standardFormData, 15)

      // Verify fixed costs breakdown
      expect(result.fixedCosts.cogs).toBe(500)
      expect(result.fixedCosts.logisticsForward).toBe(120)
      expect(result.fixedCosts.logisticsReverseEffective).toBeCloseTo(36, 1) // 180 * 0.2
      expect(result.fixedCosts.storage).toBe(25)
      expect(result.fixedCosts.acceptance).toBe(19)
      expect(result.fixedCosts.total).toBeCloseTo(700, 1)
    })

    it('should exclude storage and acceptance for FBS fulfillment', () => {
      const result = calculateTwoLevelPricing(fbsFormData, 15)

      expect(result.fixedCosts.storage).toBe(0)
      expect(result.fixedCosts.acceptance).toBe(0)
      // Total should be cogs + logistics_forward + logistics_reverse_effective
      expect(result.fixedCosts.total).toBeCloseTo(656, 1) // 500 + 120 + 36
    })
  })

  describe('Recommended Price Calculation', () => {
    it('should calculate recommended price with target margin', () => {
      const result = calculateTwoLevelPricing(standardFormData, 15)

      // total_pct_rate = 22.5% (min) + 5% (drr) + 15% (margin) = 42.5%
      // recommended = 700 / (1 - 0.425) = 700 / 0.575 ≈ 1217.39
      expect(result.recommendedPrice).toBeCloseTo(1217.39, 1)
    })

    it('should include DRR in recommended price', () => {
      const result = calculateTwoLevelPricing(standardFormData, 15)

      // DRR should be calculated from recommended price
      expect(result.variableCosts.drr.pct).toBe(5)
      expect(result.variableCosts.drr.rub).toBeCloseTo(1217.39 * 0.05, 1)
    })

    it('should calculate percentage costs based on recommended price', () => {
      const result = calculateTwoLevelPricing(standardFormData, 15)

      const price = result.recommendedPrice
      expect(result.percentageCosts.commissionWb.rub).toBeCloseTo(price * 0.15, 1)
      expect(result.percentageCosts.acquiring.rub).toBeCloseTo(price * 0.015, 1)
      expect(result.percentageCosts.taxIncome?.rub).toBeCloseTo(price * 0.06, 1)
    })
  })

  describe('Customer Price Calculation', () => {
    it('should apply SPP discount to get customer price', () => {
      const result = calculateTwoLevelPricing(standardFormData, 15)

      // Customer price = recommended * (1 - spp/100)
      // Customer = 1217.39 * 0.9 ≈ 1095.65
      expect(result.customerPrice).toBeCloseTo(1095.65, 1)
    })

    it('should handle 0% SPP correctly', () => {
      const noSppData = { ...standardFormData, spp_pct: 0 }
      const result = calculateTwoLevelPricing(noSppData, 15)

      expect(result.customerPrice).toBeCloseTo(result.recommendedPrice, 2)
    })

    it('should handle high SPP discount', () => {
      const highSppData = { ...standardFormData, spp_pct: 30 }
      const result = calculateTwoLevelPricing(highSppData, 15)

      expect(result.customerPrice).toBeCloseTo(result.recommendedPrice * 0.7, 1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle 100% percentage costs (division by zero protection)', () => {
      const highPctData: TwoLevelPricingFormData = {
        ...standardFormData,
        target_margin_pct: 50,
        drr_pct: 30,
        acquiring_pct: 10,
        tax_rate_pct: 20,
      }
      // Commission 15% + acquiring 10% + tax 20% + drr 30% + margin 50% = 125%
      const result = calculateTwoLevelPricing(highPctData, 15)

      // Should return 0 when total pct rate >= 1 to avoid negative price
      expect(result.recommendedPrice).toBe(0)
    })

    it('should handle zero fixed costs', () => {
      const zeroFixedData: TwoLevelPricingFormData = {
        ...standardFormData,
        cogs_rub: 0,
        logistics_forward_rub: 0,
        logistics_reverse_rub: 0,
        storage_rub: 0,
        acceptance_cost: 0,
      }
      const result = calculateTwoLevelPricing(zeroFixedData, 15)

      expect(result.fixedCosts.total).toBe(0)
      expect(result.minimumPrice).toBe(0)
      expect(result.recommendedPrice).toBe(0)
    })

    it('should handle zero commission percentage', () => {
      const result = calculateTwoLevelPricing(standardFormData, 0)

      // min_pct_rate = 0% + 1.5% + 6% = 7.5%
      // minimum = 700 / (1 - 0.075) = 700 / 0.925 ≈ 756.76
      expect(result.minimumPrice).toBeCloseTo(756.76, 1)
    })

    it('should handle profit tax type (not included in percentage rate)', () => {
      const profitTaxData: TwoLevelPricingFormData = {
        ...standardFormData,
        tax_type: 'profit',
        tax_rate_pct: 15,
      }
      const result = calculateTwoLevelPricing(profitTaxData, 15)

      // Tax on profit is not included in price calculation (applied to margin after)
      expect(result.percentageCosts.taxIncome).toBeNull()
      expect(result.margin.afterTax).toBeCloseTo(
        result.margin.rub * (1 - 0.15),
        1
      )
    })
  })

  describe('Price Gap Calculation', () => {
    it('should calculate price gap between recommended and minimum', () => {
      const result = calculateTwoLevelPricing(standardFormData, 15)

      // Gap rub = recommended - minimum ≈ 1217.39 - 903.23 ≈ 314.16
      expect(result.priceGap.rub).toBeCloseTo(314.16, 0)
      // Gap pct = gap / minimum * 100 ≈ 34.78%
      expect(result.priceGap.pct).toBeCloseTo(34.78, 0)
    })

    it('should handle zero minimum price in gap calculation', () => {
      const zeroFixedData: TwoLevelPricingFormData = {
        ...standardFormData,
        cogs_rub: 0,
        logistics_forward_rub: 0,
        logistics_reverse_rub: 0,
        storage_rub: 0,
        acceptance_cost: 0,
      }
      const result = calculateTwoLevelPricing(zeroFixedData, 15)

      expect(result.priceGap.pct).toBe(0) // No division by zero
    })
  })

  describe('Margin Calculation', () => {
    it('should calculate margin in rubles from recommended price', () => {
      const result = calculateTwoLevelPricing(standardFormData, 15)

      expect(result.margin.pct).toBe(15)
      expect(result.margin.rub).toBeCloseTo(result.recommendedPrice * 0.15, 1)
    })

    it('should calculate net margin after profit tax', () => {
      const profitTaxData: TwoLevelPricingFormData = {
        ...standardFormData,
        tax_type: 'profit',
        tax_rate_pct: 20,
      }
      const result = calculateTwoLevelPricing(profitTaxData, 15)

      expect(result.margin.afterTax).toBeCloseTo(result.margin.rub * 0.8, 1)
    })

    it('should not calculate after-tax margin for income tax type', () => {
      const result = calculateTwoLevelPricing(standardFormData, 15)

      expect(result.margin.afterTax).toBeNull()
    })
  })

  describe('Real Numbers from Requirements', () => {
    it('should match expected values from PRICE-CALCULATOR-REQUIREMENTS.md', () => {
      // Test case from requirements:
      // COGS=500, logistics_forward=120, logistics_reverse=180 (buyback 80%)
      // storage=25, acceptance=19, commission=15%, acquiring=1.5%
      // tax=6% (income), DRR=5%, margin=15%, SPP=10%
      const result = calculateTwoLevelPricing(standardFormData, 15)

      // Expected from requirements (approximate)
      expect(result.minimumPrice).toBeCloseTo(903, 0)
      expect(result.recommendedPrice).toBeCloseTo(1217, 0)
      expect(result.customerPrice).toBeCloseTo(1096, 0)
    })
  })
})

describe('getPriceGapColor', () => {
  it('should return green for gap > 20%', () => {
    expect(getPriceGapColor(25)).toBe('text-green-600')
    expect(getPriceGapColor(50)).toBe('text-green-600')
  })

  it('should return yellow for gap 10-20%', () => {
    expect(getPriceGapColor(15)).toBe('text-yellow-600')
    expect(getPriceGapColor(20)).toBe('text-yellow-600')
  })

  it('should return red for gap < 10%', () => {
    expect(getPriceGapColor(5)).toBe('text-red-600')
    expect(getPriceGapColor(9.9)).toBe('text-red-600')
    expect(getPriceGapColor(0)).toBe('text-red-600')
  })
})

describe('getPriceGapBgColor', () => {
  it('should return green bg for gap > 20%', () => {
    expect(getPriceGapBgColor(25)).toContain('green')
  })

  it('should return yellow bg for gap 10-20%', () => {
    expect(getPriceGapBgColor(15)).toContain('yellow')
  })

  it('should return red bg for gap < 10%', () => {
    expect(getPriceGapBgColor(5)).toContain('red')
  })
})

describe('isTightMargin', () => {
  it('should return true for gap < 10%', () => {
    expect(isTightMargin(5)).toBe(true)
    expect(isTightMargin(9.9)).toBe(true)
  })

  it('should return false for gap >= 10%', () => {
    expect(isTightMargin(10)).toBe(false)
    expect(isTightMargin(20)).toBe(false)
  })
})

describe('calculateCostPercentage', () => {
  it('should calculate cost as percentage of price', () => {
    expect(calculateCostPercentage(100, 1000)).toBe(10)
    expect(calculateCostPercentage(250, 1000)).toBe(25)
  })

  it('should return 0 for zero price', () => {
    expect(calculateCostPercentage(100, 0)).toBe(0)
  })

  it('should return 0 for negative price', () => {
    expect(calculateCostPercentage(100, -100)).toBe(0)
  })
})
