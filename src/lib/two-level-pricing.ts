/**
 * Two-Level Pricing Calculation Utilities
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Implements two-level pricing concept:
 * - Level 1: Minimum Price (floor) - covers only fixed costs, no margin, no DRR
 * - Level 2: Recommended Price - includes margin and DRR
 *
 * Reference: PRICE-CALCULATOR-REQUIREMENTS.md Section 5, Section 8
 */

import type {
  TwoLevelPricingFormData,
  TwoLevelPricingResult,
  TwoLevelFixedCosts,
  TwoLevelPercentageCosts,
  TwoLevelVariableCosts,
  TwoLevelMargin,
  PriceGap,
} from '@/types/price-calculator'

/**
 * Calculate fixed costs from form data
 * Fixed costs don't depend on selling price
 */
function calculateFixedCosts(formData: TwoLevelPricingFormData): TwoLevelFixedCosts {
  const returnRate = (100 - formData.buyback_pct) / 100
  const logisticsReverseEffective = formData.logistics_reverse_rub * returnRate

  // Storage and acceptance only apply to FBO
  const storage = formData.fulfillment_type === 'FBO' ? formData.storage_rub : 0
  const acceptance = formData.fulfillment_type === 'FBO' ? (formData.acceptance_cost ?? 0) : 0

  const total =
    formData.cogs_rub +
    formData.logistics_forward_rub +
    logisticsReverseEffective +
    storage +
    acceptance

  return {
    cogs: formData.cogs_rub,
    logisticsForward: formData.logistics_forward_rub,
    logisticsReverseEffective,
    storage,
    acceptance,
    total,
  }
}

/**
 * Calculate percentage costs based on recommended price
 */
function calculatePercentageCosts(
  recommendedPrice: number,
  commissionPct: number,
  acquiringPct: number,
  taxRatePct: number,
  taxType: 'income' | 'profit'
): TwoLevelPercentageCosts {
  const commissionRate = commissionPct / 100
  const acquiringRate = acquiringPct / 100
  const taxRate = taxType === 'income' ? taxRatePct / 100 : 0

  const commissionWb = {
    pct: commissionPct,
    rub: recommendedPrice * commissionRate,
  }

  const acquiring = {
    pct: acquiringPct,
    rub: recommendedPrice * acquiringRate,
  }

  const taxIncome =
    taxType === 'income'
      ? { pct: taxRatePct, rub: recommendedPrice * taxRate }
      : null

  const totalPct = commissionPct + acquiringPct + (taxType === 'income' ? taxRatePct : 0)
  const totalRub = commissionWb.rub + acquiring.rub + (taxIncome?.rub ?? 0)

  return {
    commissionWb,
    acquiring,
    taxIncome,
    total: { pct: totalPct, rub: totalRub },
  }
}

/**
 * Calculate variable costs (DRR) based on recommended price
 */
function calculateVariableCosts(
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
function calculateMargin(
  recommendedPrice: number,
  targetMarginPct: number,
  taxRatePct: number,
  taxType: 'income' | 'profit'
): TwoLevelMargin {
  const marginRate = targetMarginPct / 100
  const grossMargin = recommendedPrice * marginRate

  // For profit tax, calculate net margin after tax
  const afterTax =
    taxType === 'profit' ? grossMargin * (1 - taxRatePct / 100) : null

  return {
    pct: targetMarginPct,
    rub: grossMargin,
    afterTax,
  }
}

/**
 * Calculate price gap between recommended and minimum prices
 */
function calculatePriceGap(minimumPrice: number, recommendedPrice: number): PriceGap {
  const gapRub = recommendedPrice - minimumPrice
  const gapPct = minimumPrice > 0 ? (gapRub / minimumPrice) * 100 : 0

  return { rub: gapRub, pct: gapPct }
}

/**
 * Calculate two-level pricing from form data
 *
 * @param formData - Form data with all input values
 * @param commissionPct - WB commission percentage (from category selection)
 * @returns Complete two-level pricing result
 *
 * @example
 * const result = calculateTwoLevelPricing({
 *   fulfillment_type: 'FBO',
 *   cogs_rub: 500,
 *   logistics_forward_rub: 120,
 *   logistics_reverse_rub: 180,
 *   buyback_pct: 80,
 *   storage_rub: 25,
 *   acceptance_cost: 19,
 *   acquiring_pct: 1.5,
 *   drr_pct: 5,
 *   target_margin_pct: 15,
 *   tax_rate_pct: 6,
 *   tax_type: 'income',
 *   spp_pct: 10,
 * }, 15)
 */
export function calculateTwoLevelPricing(
  formData: TwoLevelPricingFormData,
  commissionPct: number
): TwoLevelPricingResult {
  // Step 1: Calculate fixed costs
  const fixedCosts = calculateFixedCosts(formData)

  // Step 2: Calculate percentage rates
  const commissionRate = commissionPct / 100
  const acquiringRate = formData.acquiring_pct / 100
  const drrRate = formData.drr_pct / 100
  const marginRate = formData.target_margin_pct / 100

  // Tax handling - income tax is included in percentage rate
  const taxRate = formData.tax_type === 'income' ? formData.tax_rate_pct / 100 : 0

  // Step 3: LEVEL 1 - Minimum price (no margin, no DRR)
  // Formula: minimum_price = fixed_costs / (1 - min_pct_rate)
  const minPctRate = commissionRate + acquiringRate + taxRate
  const minimumPrice = minPctRate < 1 ? fixedCosts.total / (1 - minPctRate) : 0

  // Step 4: LEVEL 2 - Recommended price (with margin and DRR)
  // Formula: recommended_price = fixed_costs / (1 - total_pct_rate)
  const totalPctRate = minPctRate + drrRate + marginRate
  const recommendedPrice = totalPctRate < 1 ? fixedCosts.total / (1 - totalPctRate) : 0

  // Step 5: Customer price (after SPP discount)
  const customerPrice = recommendedPrice * (1 - formData.spp_pct / 100)

  // Step 6: Calculate cost breakdowns based on recommended price
  const percentageCosts = calculatePercentageCosts(
    recommendedPrice,
    commissionPct,
    formData.acquiring_pct,
    formData.tax_rate_pct,
    formData.tax_type
  )

  const variableCosts = calculateVariableCosts(recommendedPrice, formData.drr_pct)

  const margin = calculateMargin(
    recommendedPrice,
    formData.target_margin_pct,
    formData.tax_rate_pct,
    formData.tax_type
  )

  // Step 7: Calculate price gap
  const priceGap = calculatePriceGap(minimumPrice, recommendedPrice)

  return {
    minimumPrice,
    recommendedPrice,
    customerPrice,
    priceGap,
    fixedCosts,
    percentageCosts,
    variableCosts,
    margin,
  }
}

/**
 * Get price gap status color based on margin safety
 * - Green: gap > 20% (healthy margin buffer)
 * - Yellow: gap 10-20% (moderate)
 * - Red: gap < 10% (tight margin, risk of losses)
 */
export function getPriceGapColor(gapPct: number): string {
  if (gapPct > 20) return 'text-green-600'
  if (gapPct > 10) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get price gap background color for badges
 */
export function getPriceGapBgColor(gapPct: number): string {
  if (gapPct > 20) return 'bg-green-50 dark:bg-green-950'
  if (gapPct > 10) return 'bg-yellow-50 dark:bg-yellow-950'
  return 'bg-red-50 dark:bg-red-950'
}

/**
 * Check if margin is tight (risk warning threshold)
 */
export function isTightMargin(gapPct: number): boolean {
  return gapPct < 10
}

/**
 * Calculate cost item as percentage of recommended price
 */
export function calculateCostPercentage(cost: number, price: number): number {
  if (price <= 0) return 0
  return (cost / price) * 100
}
