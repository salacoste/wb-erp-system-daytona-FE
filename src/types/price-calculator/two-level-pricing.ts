/**
 * Two-Level Pricing Types (Story 44.20)
 * Extracted from calculator.ts for max-lines compliance
 */

import type { TaxType, FulfillmentType } from './shared'

export interface TwoLevelFixedCosts {
  cogs: number
  logisticsForward: number
  logisticsReverseEffective: number
  storage: number
  acceptance: number
  packaging: number
  logisticsToMp: number
  total: number
}

export interface PercentageCostItem {
  pct: number
  rub: number
}

export interface TwoLevelPercentageCosts {
  commissionWb: PercentageCostItem
  acquiring: PercentageCostItem
  taxIncome: PercentageCostItem | null
  vat: PercentageCostItem | null
  total: PercentageCostItem
}

export interface TwoLevelVariableCosts {
  drr: PercentageCostItem
  total: PercentageCostItem
}

export interface TwoLevelMargin {
  pct: number
  rub: number
  afterTax: number | null
}

export interface PriceGap {
  rub: number
  pct: number
}

export interface TwoLevelPricingResult {
  minimumPrice: number
  recommendedPrice: number
  customerPrice: number
  priceGap: PriceGap
  fixedCosts: TwoLevelFixedCosts
  percentageCosts: TwoLevelPercentageCosts
  variableCosts: TwoLevelVariableCosts
  margin: TwoLevelMargin
}

export interface TwoLevelPricingFormData {
  fulfillment_type: FulfillmentType
  cogs_rub: number
  logistics_forward_rub: number
  logistics_reverse_rub: number
  buyback_pct: number
  storage_rub: number
  acceptance_cost?: number
  acquiring_pct: number
  drr_pct: number
  target_margin_pct: number
  tax_rate_pct: number
  tax_type: TaxType
  spp_pct: number
  packaging_rub?: number
  logistics_to_mp_rub?: number
  units_per_package?: number
  is_vat_payer?: boolean
  vat_pct?: number
}
