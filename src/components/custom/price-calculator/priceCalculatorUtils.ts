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
 * Note: fulfillment_type is used internally for UI logic only, not sent to API
 * Story 44.27: Added warehouse_id, coefficients, and delivery_date
 * Story 44.32: Added box_type, weight_exceeds_25kg, localization_index, turnover_days
 */
export function toApiRequest(data: FormData): PriceCalculatorRequest {
  const baseRequest: PriceCalculatorRequest = {
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
    ...(data.nm_id !== undefined && { overrides: { nm_id: String(data.nm_id) } }),
  }

  // Story 44.27: Warehouse & Coefficients
  if (data.warehouse_id !== null) {
    baseRequest.warehouse_id = data.warehouse_id
  }
  if (data.logistics_coefficient !== 1.0) {
    baseRequest.logistics_coefficient = data.logistics_coefficient
  }
  if (data.fulfillment_type === 'FBO' && data.storage_coefficient !== 1.0) {
    baseRequest.storage_coefficient = data.storage_coefficient
  }
  if (data.delivery_date !== null) {
    baseRequest.delivery_date = data.delivery_date
  }

  // Story 44.32: Phase 1 HIGH priority fields
  // Only send box_type and turnover_days for FBO
  if (data.fulfillment_type === 'FBO') {
    baseRequest.box_type = data.box_type
    baseRequest.turnover_days = data.turnover_days
  }

  // Send weight_exceeds_25kg for both FBO and FBS
  if (data.weight_exceeds_25kg) {
    baseRequest.weight_exceeds_25kg = true
  }

  // Send localization_index for both FBO and FBS
  if (data.localization_index !== 1.0) {
    baseRequest.localization_index = data.localization_index
  }

  return baseRequest
}
