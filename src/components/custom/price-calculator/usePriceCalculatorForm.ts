import type { FulfillmentType, TaxType, BoxType } from '@/types/price-calculator'

/**
 * Form data structure matching PriceCalculatorRequest
 * Story 44.15: Added fulfillment_type for FBO/FBS selection
 * Story 44.16: Added category_id for category selection
 * Story 44.17: Added tax_rate_pct and tax_type for tax configuration
 * Story 44.18: Added drr_pct for DRR input (replaces advertising_pct)
 * Story 44.19: Added spp_pct for SPP display (client-side only)
 * Story 44.7: Added dimension fields (length_cm, width_cm, height_cm)
 * Story 44.12: Added warehouse_id for warehouse selection
 * Story 44.27: Added warehouse coefficients and delivery date
 * Story 44.32: Added box_type, weight_exceeds_25kg, localization_index, turnover_days
 * Story 44.38: Added units_per_package for acceptance cost division
 */
export interface FormData {
  fulfillment_type: FulfillmentType
  category_id: number | null
  target_margin_pct: number
  cogs_rub: number
  logistics_forward_rub: number
  logistics_reverse_rub: number
  buyback_pct: number
  advertising_pct: number
  drr_pct: number
  spp_pct: number
  tax_rate_pct: number
  tax_type: TaxType
  storage_rub: number
  vat_pct: number
  acquiring_pct: number
  commission_pct?: number
  /** Product nm_id (STRING from backend!) - Story 44.33 */
  nm_id?: string
  /** Product length in cm (Story 44.7) */
  length_cm: number
  /** Product width in cm (Story 44.7) */
  width_cm: number
  /** Product height in cm (Story 44.7) */
  height_cm: number
  /** Selected warehouse ID (Story 44.12) */
  warehouse_id: number | null
  /** Selected warehouse name (Story 44.27) */
  warehouse_name: string | null
  /** Logistics coefficient from warehouse (Story 44.27) */
  logistics_coefficient: number
  /** Storage coefficient from warehouse (Story 44.27) */
  storage_coefficient: number
  /** Delivery date ISO string (Story 44.27) */
  delivery_date: string | null
  /** Story 44.32: Box type for FBO fulfillment (default: 'box') */
  box_type: BoxType
  /** Story 44.32: Weight exceeds 25kg threshold (default: false) */
  weight_exceeds_25kg: boolean
  /** Story 44.32: Localization index (КТР) for regional delivery (default: 1.0) */
  localization_index: number
  /** Story 44.32: Turnover days in storage for FBO (default: 20) */
  turnover_days: number
  /** Story 44.38: Units per package for acceptance cost division (default: 1) */
  units_per_package: number
  /** Story 44.XX: Calculated acceptance cost per unit (auto-filled from tariffs) */
  acceptance_cost: number
}

/**
 * Default form values
 * Story 44.15: Added fulfillment_type default to FBO
 * Story 44.16: Added category_id default to null
 * Story 44.17: Added tax_rate_pct (6%) and tax_type ('income') defaults - УСН Доходы
 * Story 44.18: Added drr_pct (5%) default for DRR
 * Story 44.19: Added spp_pct (0%) default for SPP - no discount by default
 * Story 44.32: Added box_type ('box'), weight_exceeds_25kg (false), localization_index (1.0), turnover_days (20)
 * Story 44.38: Added units_per_package (1) default for single unit
 */
export const defaultFormValues: FormData = {
  fulfillment_type: 'FBO',
  category_id: null,
  target_margin_pct: 20,
  cogs_rub: 0,
  logistics_forward_rub: 0,
  logistics_reverse_rub: 0,
  buyback_pct: 98,
  advertising_pct: 5,
  drr_pct: 5,
  spp_pct: 0,
  tax_rate_pct: 6,
  tax_type: 'income',
  storage_rub: 0,
  vat_pct: 20,
  acquiring_pct: 1.8,
  commission_pct: undefined,
  nm_id: undefined,
  /** Story 44.7: Dimension defaults */
  length_cm: 0,
  width_cm: 0,
  height_cm: 0,
  /** Story 44.12: Warehouse selection default */
  warehouse_id: null,
  /** Story 44.27: Warehouse name default */
  warehouse_name: null,
  /** Story 44.27: Coefficient defaults (1.0 = base rate) */
  logistics_coefficient: 1.0,
  storage_coefficient: 1.0,
  delivery_date: null,
  /** Story 44.32: Box type default (standard box) */
  box_type: 'box',
  /** Story 44.32: Weight threshold default (not exceeded) */
  weight_exceeds_25kg: false,
  /** Story 44.32: Localization index default (Central Federal District) */
  localization_index: 1.0,
  /** Story 44.32: Turnover days default (typical for WB) */
  turnover_days: 20,
  /** Story 44.38: Units per package default (single unit) */
  units_per_package: 1,
  /** Story 44.XX: Acceptance cost default (0 until calculated) */
  acceptance_cost: 0,
}
