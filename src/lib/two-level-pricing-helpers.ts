/**
 * Two-Level Pricing Internal Calculation Helpers
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Extracted from two-level-pricing.ts for file size compliance.
 * Internal helper functions for fixed costs, percentage costs,
 * variable costs, margin, and price gap calculations.
 *
 * Reference: PRICE-CALCULATOR-REQUIREMENTS.md Section 5, Section 8
 */

import type {
  TwoLevelPricingFormData,
  TwoLevelFixedCosts,
  TwoLevelPercentageCosts,
  TwoLevelVariableCosts,
  TwoLevelMargin,
  PriceGap,
} from '@/types/price-calculator'

/**
 * Calculate fixed costs from form data
 * Fixed costs don't depend on selling price
 * Story 44.51: Added packaging and logistics to marketplace (divided by units_per_package)
 */
export function calculateFixedCosts(formData: TwoLevelPricingFormData): TwoLevelFixedCosts {
  const returnRate = (100 - formData.buyback_pct) / 100
  const logisticsReverseEffective = formData.logistics_reverse_rub * returnRate

  // Storage and acceptance only apply to FBO
  const storage = formData.fulfillment_type === 'FBO' ? formData.storage_rub : 0
  // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: acceptance_cost 0 = FBO without acceptance fee (legitimate)
  const acceptance = formData.fulfillment_type === 'FBO' ? (formData.acceptance_cost ?? 0) : 0

  // Story 44.51: Packaging and logistics to MP - per box/pallet costs divided by units
  const unitsPerPackage = Math.max(formData.units_per_package ?? 1, 1)
  // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: packaging_rub 0 = no cost entered (form default)
  const packaging = (formData.packaging_rub ?? 0) / unitsPerPackage
  // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: logistics_to_mp_rub 0 = no cost entered (form default)
  const logisticsToMp = (formData.logistics_to_mp_rub ?? 0) / unitsPerPackage

  const total =
    formData.cogs_rub +
    formData.logistics_forward_rub +
    logisticsReverseEffective +
    storage +
    acceptance +
    packaging +
    logisticsToMp

  return {
    cogs: formData.cogs_rub,
    logisticsForward: formData.logistics_forward_rub,
    logisticsReverseEffective,
    storage,
    acceptance,
    packaging,
    logisticsToMp,
    total,
  }
}

/**
 * Calculate percentage costs based on recommended price
 * Added VAT support
 */
export function calculatePercentageCosts(
  recommendedPrice: number,
  commissionPct: number,
  acquiringPct: number,
  taxRatePct: number,
  taxType: 'income' | 'profit',
  isVatPayer: boolean,
  vatPct: number
): TwoLevelPercentageCosts {
  const commissionRate = commissionPct / 100
  const acquiringRate = acquiringPct / 100
  const taxRate = taxType === 'income' ? taxRatePct / 100 : 0
  const vatRate = isVatPayer ? vatPct / 100 : 0

  const commissionWb = {
    pct: commissionPct,
    rub: recommendedPrice * commissionRate,
  }

  const acquiring = {
    pct: acquiringPct,
    rub: recommendedPrice * acquiringRate,
  }

  const taxIncome =
    taxType === 'income' ? { pct: taxRatePct, rub: recommendedPrice * taxRate } : null

  // VAT calculation (only if payer)
  const vat = isVatPayer ? { pct: vatPct, rub: recommendedPrice * vatRate } : null

  const totalPct =
    commissionPct +
    acquiringPct +
    (taxType === 'income' ? taxRatePct : 0) +
    (isVatPayer ? vatPct : 0)
  // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: taxIncome/vat 0 = tax type not applicable (arithmetic identity)
  const totalRub = commissionWb.rub + acquiring.rub + (taxIncome?.rub ?? 0) + (vat?.rub ?? 0)

  return {
    commissionWb,
    acquiring,
    taxIncome,
    vat,
    total: { pct: totalPct, rub: totalRub },
  }
}

/**
 * Calculate variable costs (DRR) based on recommended price
 */
export function calculateVariableCosts(
  recommendedPrice: number,
  drrPct: number
): TwoLevelVariableCosts {
  const drrRate = drrPct / 100
  const drr = { pct: drrPct, rub: recommendedPrice * drrRate }

  return {
    drr,
    total: { pct: drrPct, rub: drr.rub },
  }
}

/**
 * Calculate margin information
 */
export function calculateMargin(
  recommendedPrice: number,
  targetMarginPct: number,
  taxRatePct: number,
  taxType: 'income' | 'profit'
): TwoLevelMargin {
  const marginRate = targetMarginPct / 100
  const grossMargin = recommendedPrice * marginRate

  // For profit tax, calculate net margin after tax
  const afterTax = taxType === 'profit' ? grossMargin * (1 - taxRatePct / 100) : null

  return {
    pct: targetMarginPct,
    rub: grossMargin,
    afterTax,
  }
}

/**
 * Calculate price gap between recommended and minimum prices
 */
export function calculatePriceGap(minimumPrice: number, recommendedPrice: number): PriceGap {
  const gapRub = recommendedPrice - minimumPrice
  const gapPct = minimumPrice > 0 ? (gapRub / minimumPrice) * 100 : 0

  return { rub: gapRub, pct: gapPct }
}
