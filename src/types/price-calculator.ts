/**
 * Price Calculator Types
 * Story 44.1-FE: TypeScript Types & API Client
 * Epic 44: Price Calculator UI (Frontend)
 * Reference: docs/request-backend/95-epic-43-price-calculator-api.md
 */

// ============================================================================
// Request Types
// ============================================================================

/**
 * Price calculator request parameters
 * Matches backend DTO from Epic 43
 */
export interface PriceCalculatorRequest {
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
  /** Storage cost in rubles */
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
