/**
 * Price Calculator Types
 * Story 44.1-FE: TypeScript Types & API Client
 * Story 44.15-FE: FBO/FBS Fulfillment Type Selection
 * Story 44.17-FE: Tax Configuration Types
 * Story 44.18-FE: DRR Input Types
 * Story 44.26b-FE: Auto-fill Dimensions & Category Types
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
// Story 44.32: Missing Price Calculator Fields (Phase 1 HIGH Priority)
// ============================================================================

/**
 * Box type for FBO fulfillment
 * - 'box': Standard box delivery (paidStorageKgvp commission)
 * - 'pallet': Large items on pallet (different tariff structure)
 *
 * Business Impact: Pallet has fixed ~500₽ acceptance, box is ~1.70₽/liter
 */
export type BoxType = 'box' | 'pallet'

/**
 * Box type configuration
 */
export const BOX_TYPE_CONFIG: Record<BoxType, {
  label: string
  description: string
  apiId: number
}> = {
  box: {
    label: 'Короб',
    description: 'Стандартная доставка в коробе',
    apiId: 2,
  },
  pallet: {
    label: 'Монопаллета',
    description: 'Крупногабаритные товары на паллете',
    apiId: 5,
  },
} as const

/**
 * Localization index ranges
 * Central Federal District: 1.0-1.2
 * Regions: 1.3-1.7
 * Remote (Far East/North): 1.8-2.5
 */
export const LOCALIZATION_RANGES = {
  MIN: 0.5,
  MAX: 3.0,
  STEP: 0.1,
  DEFAULT: 1.0,
  ZONES: {
    central: { min: 1.0, max: 1.2, label: 'Центральный ФО' },
    regional: { min: 1.3, max: 1.7, label: 'Регионы' },
    remote: { min: 1.8, max: 2.5, label: 'Дальний Восток / Крайний Север' },
  } as const,
} as const

// ============================================================================
// Request Types
// ============================================================================

/**
 * Price calculator request parameters
 * Matches backend DTO from Epic 43
 * Updated for Story 44.15 with fulfillment_type support
 * Updated for Story 44.32 with Phase 1 HIGH priority fields
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
   * Story 44.32: Box type for FBO (default: 'box')
   * Only applies to FBO fulfillment
   *
   * @frontend-only NOT sent to API (Story 44.36)
   * Backend does not support this field yet
   * @todo Re-enable when backend Epic 45/46 implements support
   */
  box_type?: BoxType
  /**
   * Story 44.32: Weight exceeds 25kg threshold (default: false)
   * Applies 1.5x multiplier to logistics cost
   *
   * @frontend-only NOT sent to API (Story 44.37)
   * Backend does not support this field yet
   */
  weight_exceeds_25kg?: boolean
  /**
   * Story 44.32: Localization index (КТР) for regional delivery (default: 1.0)
   * Range: 0.5-3.0, auto-filled from warehouse delivery coefficient
   *
   * @frontend-only NOT sent to API (Story 44.37)
   * Backend does not support this field yet
   */
  localization_index?: number
  /**
   * Turnover days in storage (FBO only, default: 20)
   * This is the ONLY storage duration field.
   *
   * Frontend calculation: storage_rub = daily_storage_cost × turnover_days
   *
   * @example turnover_days: 20 → 20 days average to sell
   *
   * @frontend-only NOT sent to API (Story 44.36)
   * Backend does not support this field yet
   * @todo Re-enable when backend Epic 45/46 implements support
   */
  turnover_days?: number
  /**
   * Story 44.27: Warehouse ID for coefficient lookup
   *
   * @frontend-only NOT sent to API (Story 44.37)
   * Backend does not support this field yet
   */
  warehouse_id?: number
  /**
   * Story 44.27: Logistics coefficient from warehouse (default: 1.0)
   * Multiplier for forward logistics cost
   *
   * @frontend-only NOT sent to API (Story 44.37)
   * Backend does not support this field yet
   */
  logistics_coefficient?: number
  /**
   * Story 44.27: Storage coefficient from warehouse (default: 1.0)
   * Multiplier for storage cost (FBO only)
   *
   * @frontend-only NOT sent to API (Story 44.37)
   * Backend does not support this field yet
   */
  storage_coefficient?: number
  /**
   * Story 44.27: Warehouse name for auto-fill (Epic 43 backend API)
   * Triggers tariff lookup and automatic logistics/storage cost calculation
   *
   * @example
   * warehouse_name: "Коледино" - Auto-fills logistics from warehouse tariffs
   */
  warehouse_name?: string

  /**
   * Story 44.27: Product volume in liters (can be calculated from dimensions)
   * Alternative to providing dimensions object
   *
   * @example
   * volume_liters: 6.0 - 30cm × 20cm × 10cm / 1000
   */
  volume_liters?: number

  /**
   * Story 44.27: Delivery type for tariff selection
   * Maps to frontend's fulfillment_type ("fbo" | "fbs")
   *
   * @example
   * delivery_type: "fbo" - WB warehouse fulfillment
   */
  delivery_type?: "fbo" | "fbs"

  /**
   * Story 43.7: Product dimensions for volume calculation and tariff lookup
   * Alternative to volume_liters - backend calculates volume from dimensions
   *
   * @example
   * dimensions: { length_cm: 30, width_cm: 20, height_cm: 10 }
   */
  dimensions?: {
    length_cm: number
    width_cm: number
    height_cm: number
  }

  /**
   * Story 44.27: Delivery date in ISO format (YYYY-MM-DD)
   * Used for coefficient calendar lookup
   *
   * @frontend-only NOT sent to API (Story 44.37)
   * Backend does not support this field yet
   */
  delivery_date?: string
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
   * overrides: { commission_pct: 8.0, nm_id: "147205694" }
   */
  overrides?: {
    /**
     * Override commission percentage
     * Takes precedence over root-level commission_pct if both are provided
     */
    commission_pct?: number
    /** Filter by specific product (STRING from backend!) */
    nm_id?: string
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

// ============================================================================
// Auto-fill Types (Story 44.26b)
// ============================================================================

/**
 * Source of auto-filled value
 * - 'auto': Value populated from product selection (WB catalog)
 * - 'manual': Value entered manually by user
 */
export type AutoFillSource = 'auto' | 'manual'

/**
 * Auto-fill badge display status
 * - 'auto': Showing "Автозаполнено" (green badge)
 * - 'modified': Showing "Изменено" (yellow badge) with restore button
 * - 'none': No badge displayed (manual entry mode)
 */
export type AutoFillStatus = 'auto' | 'modified' | 'none'

/**
 * Dimension auto-fill state for tracking changes
 * Used to manage dimensions section when product is selected
 */
export interface DimensionAutoFillState {
  /** Source of current values */
  source: AutoFillSource
  /** Original values from product for restore functionality */
  originalValues: {
    length_cm: number
    width_cm: number
    height_cm: number
    volume_liters: number // Pre-calculated by backend
  } | null
  /** Current status for badge display */
  status: AutoFillStatus
}

/**
 * Category auto-fill state for tracking selection mode
 * Used to manage category section lock/unlock behavior
 */
export interface CategoryAutoFillState {
  /** Source of current selection */
  source: AutoFillSource
  /** Whether category selector is locked (product selected) */
  isLocked: boolean
  /** Original category from product for restore functionality */
  originalCategory: CategoryHierarchy | null
}

// ============================================================================
// Product Dimensions & Category Types (Backend Epic 45)
// ============================================================================

/**
 * Product dimensions from WB catalog (in millimeters)
 * Backend Epic 45 - Products Dimensions & Category API
 *
 * CRITICAL: All dimensions are in mm from backend!
 * Frontend must convert: mm / 10 = cm
 */
export interface ProductDimensionsMm {
  /** Length in millimeters */
  length_mm: number
  /** Width in millimeters */
  width_mm: number
  /** Height in millimeters */
  height_mm: number
  /** Volume in liters (pre-calculated by backend: L×W×H/1000000) */
  volume_liters: number
}

/**
 * Category hierarchy from WB catalog
 * Backend Epic 45 - Products Dimensions & Category API
 *
 * NOTE: Field name in API response is "category_hierarchy", NOT "category"!
 */
export interface CategoryHierarchy {
  /** WB subject (subcategory) ID */
  subject_id: number
  /** Subject name (e.g., "Платья") */
  subject_name: string
  /** Parent category ID (null for top-level categories) */
  parent_id: number | null
  /** Parent category name (null for top-level categories) */
  parent_name: string | null
}

/**
 * Product with dimensions and category for Price Calculator
 * Backend Epic 45 - Products Dimensions & Category API
 *
 * CRITICAL Implementation Notes:
 * - nm_id is STRING (backend returns "147205694", not 147205694)
 * - Product name field is "sa_name" (WB naming), not "title"
 * - Category field is "category_hierarchy", not "category"
 * - volume_liters is pre-calculated by backend (no frontend calc needed)
 */
export interface ProductWithDimensions {
  /** Wildberries nomenclature ID (STRING from backend!) */
  nm_id: string
  /** Vendor code / article */
  vendor_code: string
  /** Product name (WB uses "sa_name", NOT "title") */
  sa_name: string
  /** Brand name */
  brand?: string
  /** Photo URL */
  photo_url?: string
  /** Whether product has COGS assigned */
  has_cogs?: boolean
  /** COGS data if available */
  cogs?: {
    unit_cost_rub: number
    valid_from: string
  }
  /** Product dimensions (null if not set in WB) */
  dimensions?: ProductDimensionsMm | null
  /** Category hierarchy (null if not set in WB) */
  category_hierarchy?: CategoryHierarchy | null
}

/**
 * Products with dimensions API response
 * GET /v1/products?include_dimensions=true
 */
export interface ProductsWithDimensionsResponse {
  products: ProductWithDimensions[]
  pagination: {
    next_cursor: string | null
    has_more: boolean
    count: number
    total: number
  }
}

/**
 * Parameters for fetching products with dimensions
 */
export interface GetProductsWithDimensionsParams {
  /** Search query (matches sa_name, vendor_code) */
  search?: string
  /** Include dimensions in response */
  include_dimensions?: boolean
  /** Include COGS data in response */
  include_cogs?: boolean
  /** Include storage data in response */
  include_storage?: boolean
  /** Limit results per page */
  limit?: number
  /** Pagination cursor */
  cursor?: string
  /** Bypass Redis cache (default: false) */
  skip_cache?: boolean
}

// ============================================================================
// Delivery Date Types (Story 44.26a-FE)
// ============================================================================

/**
 * Delivery date status based on coefficient
 * Story 44.26a-FE: DeliveryDatePicker
 */
export type DeliveryDateStatus = 'base' | 'elevated' | 'high' | 'peak' | 'unavailable'

/**
 * Delivery date selection state
 * Story 44.26a-FE: For form state management
 */
export interface DeliveryDateState {
  /** Selected date in ISO format (YYYY-MM-DD) */
  date: string | null
  /** Coefficient for the selected date (normalized: 1.0, 1.25, etc.) */
  coefficient: number
  /** Formatted date for display ("21 января 2026") */
  formattedDate: string
  /** Status for styling */
  status: DeliveryDateStatus
}

/**
 * Coefficient calendar day (enhanced for click-to-select)
 * Story 44.26a-FE: CoefficientCalendar
 */
export interface CoefficientDay {
  /** Date in ISO format */
  date: string
  /** Normalized coefficient (1.0, 1.25, etc.) */
  coefficient: number
  /** Whether date is available for selection */
  isAvailable: boolean
  /** Whether date is currently selected */
  isSelected: boolean
  /** Status for styling */
  status: DeliveryDateStatus
}
