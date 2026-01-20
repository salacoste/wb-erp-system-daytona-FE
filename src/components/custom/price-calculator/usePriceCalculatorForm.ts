import type { FulfillmentType, TaxType } from '@/types/price-calculator'

/**
 * Form data structure matching PriceCalculatorRequest
 * Story 44.15: Added fulfillment_type for FBO/FBS selection
 * Story 44.16: Added category_id for category selection
 * Story 44.17: Added tax_rate_pct and tax_type for tax configuration
 * Story 44.18: Added drr_pct for DRR input (replaces advertising_pct)
 * Story 44.19: Added spp_pct for SPP display (client-side only)
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
  nm_id?: number
}

/**
 * Default form values
 * Story 44.15: Added fulfillment_type default to FBO
 * Story 44.16: Added category_id default to null
 * Story 44.17: Added tax_rate_pct (6%) and tax_type ('income') defaults - УСН Доходы
 * Story 44.18: Added drr_pct (5%) default for DRR
 * Story 44.19: Added spp_pct (0%) default for SPP - no discount by default
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
}
