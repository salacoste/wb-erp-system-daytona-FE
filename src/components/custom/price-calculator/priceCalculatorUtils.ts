import type {
  PriceCalculatorRequest,
  TwoLevelPricingFormData,
} from '@/types/price-calculator'
import type { FormData } from './usePriceCalculatorForm'

/**
 * Check if all form values are zero (empty form state)
 */
export function isFormEmpty(data: FormData): boolean {
  return (
    data.target_margin_pct === 0 &&
    data.cogs_rub === 0 &&
    data.logistics_forward_rub === 0 &&
    data.logistics_reverse_rub === 0 &&
    data.buyback_pct === 0 &&
    data.advertising_pct === 0 &&
    data.storage_rub === 0
  )
}

/**
 * Convert form data to TwoLevelPricingFormData for two-level pricing calculation
 */
export function toTwoLevelFormData(data: FormData): TwoLevelPricingFormData {
  return {
    fulfillment_type: data.fulfillment_type,
    cogs_rub: data.cogs_rub,
    logistics_forward_rub: data.logistics_forward_rub,
    logistics_reverse_rub: data.logistics_reverse_rub,
    buyback_pct: data.buyback_pct,
    storage_rub: data.fulfillment_type === 'FBS' ? 0 : data.storage_rub,
    acquiring_pct: data.acquiring_pct,
    drr_pct: data.drr_pct,
    target_margin_pct: data.target_margin_pct,
    tax_rate_pct: data.tax_rate_pct,
    tax_type: data.tax_type,
    spp_pct: data.spp_pct,
  }
}

/**
 * Convert form data to PriceCalculatorRequest for API submission
 */
export function toApiRequest(data: FormData): PriceCalculatorRequest {
  return {
    fulfillment_type: data.fulfillment_type,
    target_margin_pct: data.target_margin_pct,
    cogs_rub: data.cogs_rub,
    logistics_forward_rub: data.logistics_forward_rub,
    logistics_reverse_rub: data.logistics_reverse_rub,
    buyback_pct: data.buyback_pct,
    advertising_pct: data.advertising_pct,
    storage_rub: data.fulfillment_type === 'FBS' ? 0 : data.storage_rub,
    vat_pct: data.vat_pct,
    acquiring_pct: data.acquiring_pct,
    ...(data.commission_pct !== undefined && { commission_pct: data.commission_pct }),
    ...(data.nm_id !== undefined && { overrides: { nm_id: data.nm_id } }),
  }
}
