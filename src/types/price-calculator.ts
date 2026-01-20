/**
 * Price Calculator Types
 * Story 44.1-FE: TypeScript Types & API Client
 * Story 44.15-FE: FBO/FBS Fulfillment Type Selection
 * Story 44.17-FE: Tax Configuration Types
 * Story 44.18-FE: DRR Input Types
 * Epic 44: Price Calculator UI (Frontend)
 * Reference: docs/request-backend/95-epic-43-price-calculator-api.md
 */

// ============================================================================
// Tax Types (Story 44.17)
// ============================================================================

/**
 * Tax calculation type
 * - 'income': Tax on total revenue (e.g., УСН Доходы, Самозанятый)
 * - 'profit': Tax on profit after expenses (e.g., УСН Доходы-Расходы, ОСН)
 */
export type TaxType = 'income' | 'profit'

/**
 * Tax configuration for price calculation
 */
export interface TaxConfiguration {
  /** Tax rate percentage (0-50) */
  tax_rate_pct: number
  /** Tax calculation type */
  tax_type: TaxType
}

/**
 * Tax regime preset definition
 */
export interface TaxPreset {
  /** Unique identifier */
  id: string
  /** Display name (Russian) */
  name: string
  /** Tax rate percentage */
  rate: number
  /** Tax type (income or profit) */
  type: TaxType
  /** Description (Russian) */
  description: string
}

// ============================================================================
// Fulfillment Types (Story 44.15)
// ============================================================================

/**
 * Fulfillment type for price calculation
 * - FBO: Fulfillment by WB (товар на складе WB) - uses paidStorageKgvp commission
 * - FBS: Fulfillment by Seller (товар у продавца) - uses kgvpMarketplace commission
 *
 * Business Impact: FBS commission is typically 3-4% higher than FBO
 */
export type FulfillmentType = 'FBO' | 'FBS'

/**
 * Commission field mapping by fulfillment type
 * Used for looking up commission rates from category data
 */
export const COMMISSION_FIELD_MAP = {
  FBO: 'paidStorageKgvp',
  FBS: 'kgvpMarketplace',
} as const

// ============================================================================
// Request Types
// ============================================================================

/**
 * Price calculator request parameters
 * Matches backend DTO from Epic 43
 * Updated for Story 44.15 with fulfillment_type support
 */
export interface PriceCalculatorRequest {
  /** Fulfillment type: FBO (WB warehouse) or FBS (seller warehouse) */
  fulfillment_type?: FulfillmentType
  /** Target margin percentage (e.g., 20.0 for 20%) */
  target_margin_pct: number
  /** Cost of goods sold in rubles */
  cogs_rub: number
  /** Forward logistics cost in rubles */
  logistics_forward_rub: number
  /** Reverse logistics cost in rubles */
  logistics_reverse_rub: number
  /** Buyback percentage (e.g., 98.0 for 98%) */
  buyback_pct: number
  /** Advertising percentage of price */
  advertising_pct: number
  /** Storage cost in rubles (FBO only, set to 0 for FBS) */
  storage_rub: number
  /** VAT percentage (optional, default: 20) */
  vat_pct?: number
  /** Acquiring percentage (optional) */
  acquiring_pct?: number
  /**
   * Commission percentage (optional)
   * @deprecated Use overrides.commission_pct instead for clarity
   * Root-level commission_pct is supported for backward compatibility
   */
  commission_pct?: number
  /**
   * Optional overrides for specific calculations
   * @example
   * // Override commission for a specific product
   * overrides: { commission_pct: 8.0, nm_id: 147205694 }
   */
  overrides?: {
    /**
     * Override commission percentage
     * Takes precedence over root-level commission_pct if both are provided
     */
    commission_pct?: number
    /** Filter by specific product */
    nm_id?: number
  }
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Price calculator response with recommended price and cost breakdown
 * Structure matches backend API response from Epic 43
 */
export interface PriceCalculatorResponse {
  /** Response metadata */
  meta: PriceCalculatorMeta
  /** Calculation result with recommended price */
  result: PriceCalculatorResult
  /** Fixed cost breakdown */
  cost_breakdown: FixedCosts
  /** Percentage-based cost breakdown (separate from cost_breakdown at API root level) */
  percentage_breakdown: PercentageBreakdown
  /** Intermediate calculation values */
  intermediate_values: IntermediateValues
  /** Warning messages from backend */
  warnings: string[]
}

/**
 * Response metadata
 */
export interface PriceCalculatorMeta {
  /** Cabinet ID used for calculation */
  cabinet_id: string
  /** ISO timestamp of calculation */
  calculated_at: string
}

/**
 * Calculation result with recommended price
 */
export interface PriceCalculatorResult {
  /** Recommended selling price in rubles */
  recommended_price: number
  /** Target margin percentage (from request) */
  target_margin_pct: number
  /** Actual margin in rubles */
  actual_margin_rub: number
  /** Actual margin percentage achieved */
  actual_margin_pct: number
}

/**
 * Fixed cost components (was CostBreakdown)
 * API returns this as cost_breakdown at root level
 */
export interface FixedCosts {
  /** Cost of goods sold */
  cogs: number
  /** Forward logistics cost */
  logistics_forward: number
  /** Effective reverse logistics cost */
  logistics_reverse_effective: number
  /** Total logistics cost */
  logistics_total: number
  /** Storage cost */
  storage: number
  /** Sum of all fixed costs */
  fixed_total: number
}

/**
 * Percentage-based cost components
 * API returns simple numbers for most fields, not objects
 * commission_pct is separate field with percentage value
 */
export interface PercentageBreakdown {
  /** WB commission amount in rubles (calculated from price * rate) */
  commission_wb: number
  /** Commission percentage rate (e.g., 10 for 10%) */
  commission_pct: number
  /** Payment acquiring amount in rubles */
  acquiring: number
  /** Advertising spend amount in rubles */
  advertising: number
  /** VAT amount in rubles */
  vat: number
  /** Margin/profit amount in rubles */
  margin: number
  /** Total percentage costs amount in rubles */
  percentage_total: number
}

/**
 * Total costs summary
 */
export interface TotalCosts {
  /** Total costs in rubles */
  rub: number
  /** Total costs as percentage of selling price */
  pct_of_price: number
}

/**
 * Intermediate calculation values
 */
export interface IntermediateValues {
  /** Buyback rate percentage */
  buyback_rate_pct: number
  /** Return rate percentage */
  return_rate_pct: number
  /** Effective logistics rate */
  logistics_effective: number
  /** Total percentage rate (sum of all percentage costs) */
  total_percentage_rate: number
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Price calculator error response
 * ApiError class from api-client wraps this
 */
export interface PriceCalculatorErrorResponse {
  code: ErrorCode
  message: string
  details?: Array<{ field: string; issue: string }>
  trace_id?: string
}

/**
 * Error code types
 */
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

/**
 * Fixed costs breakdown for two-level pricing
 * Includes all costs that don't depend on price
 */
export interface TwoLevelFixedCosts {
  /** Cost of goods sold */
  cogs: number
  /** Forward logistics cost */
  logisticsForward: number
  /** Effective reverse logistics (adjusted for return rate) */
  logisticsReverseEffective: number
  /** Storage cost (FBO only) */
  storage: number
  /** Acceptance cost (FBO only) */
  acceptance: number
  /** Total fixed costs */
  total: number
}

/**
 * Percentage cost item with both % and ₽ values
 */
export interface PercentageCostItem {
  /** Percentage rate */
  pct: number
  /** Amount in rubles (calculated from price) */
  rub: number
}

/**
 * Percentage costs breakdown for two-level pricing
 */
export interface TwoLevelPercentageCosts {
  /** WB commission */
  commissionWb: PercentageCostItem
  /** Payment acquiring fee */
  acquiring: PercentageCostItem
  /** Tax on income (only for income tax type) */
  taxIncome: PercentageCostItem | null
  /** Total percentage costs */
  total: PercentageCostItem
}

/**
 * Variable costs (DRR advertising) - not included in minimum price
 */
export interface TwoLevelVariableCosts {
  /** DRR advertising percentage and amount */
  drr: PercentageCostItem
  /** Total variable costs */
  total: PercentageCostItem
}

/**
 * Margin information with optional after-tax value
 */
export interface TwoLevelMargin {
  /** Margin percentage */
  pct: number
  /** Margin in rubles */
  rub: number
  /** Net margin after profit tax (only for profit tax type) */
  afterTax: number | null
}

/**
 * Price gap between minimum and recommended prices
 */
export interface PriceGap {
  /** Gap in rubles */
  rub: number
  /** Gap as percentage of minimum price */
  pct: number
}

/**
 * Complete two-level pricing calculation result
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Level 1: Minimum Price - covers only fixed costs (price floor)
 * Level 2: Recommended Price - includes DRR + target margin
 */
export interface TwoLevelPricingResult {
  /** Minimum price (floor) - covers fixed costs only, no margin */
  minimumPrice: number
  /** Recommended price - includes margin and DRR */
  recommendedPrice: number
  /** Customer price after SPP discount */
  customerPrice: number
  /** Gap between recommended and minimum price */
  priceGap: PriceGap

  /** Fixed costs breakdown */
  fixedCosts: TwoLevelFixedCosts
  /** Percentage costs breakdown (commission, acquiring, tax) */
  percentageCosts: TwoLevelPercentageCosts
  /** Variable costs (DRR) - not in minimum price */
  variableCosts: TwoLevelVariableCosts
  /** Margin breakdown */
  margin: TwoLevelMargin
}

/**
 * Form data needed for two-level pricing calculation
 * Subset of full PriceCalculatorRequest with additional fields
 */
export interface TwoLevelPricingFormData {
  /** Fulfillment type for conditional costs */
  fulfillment_type: FulfillmentType
  /** Cost of goods sold */
  cogs_rub: number
  /** Forward logistics */
  logistics_forward_rub: number
  /** Reverse logistics (before return rate adjustment) */
  logistics_reverse_rub: number
  /** Buyback percentage for return rate calculation */
  buyback_pct: number
  /** Storage cost (FBO only) */
  storage_rub: number
  /** Acceptance cost (FBO only) - defaults to 0 */
  acceptance_cost?: number
  /** Acquiring percentage */
  acquiring_pct: number
  /** DRR advertising percentage */
  drr_pct: number
  /** Target margin percentage */
  target_margin_pct: number
  /** Tax rate percentage */
  tax_rate_pct: number
  /** Tax type (income or profit) */
  tax_type: TaxType
  /** SPP percentage for customer price */
  spp_pct: number
}
