/**
 * Price Calculator — Request, Response & Calculation Types
 * Extracted from price-calculator.ts (Story 99.1-FE)
 */

// ============================================================================
// Request Types
// ============================================================================

import type { TaxType, FulfillmentType, BoxType } from './shared'

export interface PriceCalculatorRequest {
  fulfillment_type?: FulfillmentType
  target_margin_pct: number
  cogs_rub: number
  logistics_forward_rub: number
  logistics_reverse_rub: number
  buyback_pct: number
  advertising_pct: number
  storage_rub: number
  vat_pct?: number
  acquiring_pct?: number
  box_type?: BoxType
  weight_exceeds_25kg?: boolean
  localization_index?: number
  turnover_days?: number
  warehouse_id?: number
  logistics_coefficient?: number
  storage_coefficient?: number
  warehouse_name?: string
  volume_liters?: number
  delivery_type?: 'fbo' | 'fbs'
  dimensions?: {
    length_cm: number
    width_cm: number
    height_cm: number
  }
  delivery_date?: string
  commission_pct?: number
  overrides?: {
    commission_pct?: number
    nm_id?: string
  }
}

// ============================================================================
// Response Types
// ============================================================================

export interface PriceCalculatorResponse {
  meta: PriceCalculatorMeta
  result: PriceCalculatorResult
  cost_breakdown: FixedCosts
  percentage_breakdown: PercentageBreakdown
  intermediate_values: IntermediateValues
  warnings: string[]
}

export interface PriceCalculatorMeta {
  cabinet_id: string
  calculated_at: string
}

export interface PriceCalculatorResult {
  recommended_price: number
  target_margin_pct: number
  actual_margin_rub: number
  actual_margin_pct: number
}

export interface FixedCosts {
  cogs: number
  logistics_forward: number
  logistics_reverse_effective: number
  logistics_total: number
  storage: number
  fixed_total: number
}

export interface PercentageBreakdown {
  commission_wb: number
  commission_pct: number
  acquiring: number
  advertising: number
  vat: number
  margin: number
  percentage_total: number
}

export interface TotalCosts {
  rub: number
  pct_of_price: number
}

export interface IntermediateValues {
  buyback_rate_pct: number
  return_rate_pct: number
  logistics_effective: number
  total_percentage_rate: number
}

// ============================================================================
// Error Types
// ============================================================================

export interface PriceCalculatorErrorResponse {
  code: ErrorCode
  message: string
  details?: Array<{ field: string; issue: string }>
  trace_id?: string
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'

// ============================================================================
// Two-Level Pricing Types (Story 44.20)
// ============================================================================

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
