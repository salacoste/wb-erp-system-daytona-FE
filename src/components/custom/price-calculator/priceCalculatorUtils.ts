import type {
  PriceCalculatorRequest,
  TwoLevelPricingFormData,
} from '@/types/price-calculator'
import type { FormData } from './usePriceCalculatorForm'

/**
 * Story 44.38: Calculate per-unit acceptance cost
 * Divides total package acceptance cost by units per package
 *
 * @param acceptanceTotal - Total acceptance cost for the package in rubles
 * @param unitsPerPackage - Number of product units in the package
 * @returns Per-unit acceptance cost in rubles
 *
 * @example
 * // Box costs 100₽, contains 10 units
 * calculateAcceptancePerUnit(100, 10) // Returns 10
 *
 * // Pallet costs 500₽, contains 100 units
 * calculateAcceptancePerUnit(500, 100) // Returns 5
 */
export function calculateAcceptancePerUnit(
  acceptanceTotal: number,
  unitsPerPackage: number
): number {
  // Fallback to total cost if invalid units
  if (unitsPerPackage <= 0) return acceptanceTotal
  return acceptanceTotal / unitsPerPackage
}

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
 * Story 44.XX: Added acceptance_cost for FBO acceptance fees
 * Story 44.XX: Added VAT support (is_vat_payer, vat_pct)
 */
export function toTwoLevelFormData(data: FormData): TwoLevelPricingFormData {
  return {
    fulfillment_type: data.fulfillment_type,
    cogs_rub: data.cogs_rub,
    logistics_forward_rub: data.logistics_forward_rub,
    logistics_reverse_rub: data.logistics_reverse_rub,
    buyback_pct: data.buyback_pct,
    storage_rub: data.fulfillment_type === 'FBS' ? 0 : data.storage_rub,
    // Story 44.XX: Pass acceptance cost for FBO (0 for FBS)
    acceptance_cost: data.fulfillment_type === 'FBO' ? data.acceptance_cost : 0,
    acquiring_pct: data.acquiring_pct,
    drr_pct: data.drr_pct,
    target_margin_pct: data.target_margin_pct,
    tax_rate_pct: data.tax_rate_pct,
    tax_type: data.tax_type,
    // Story 44.XX: VAT configuration (ОСН payers)
    is_vat_payer: data.is_vat_payer,
    vat_pct: data.vat_pct,
    spp_pct: data.spp_pct,
  }
}

/**
 * Convert form data to PriceCalculatorRequest for API submission
 * Note: fulfillment_type is used internally for UI logic only, not sent to API
 *
 * Story 44.37: Remove unsupported fields from API request
 * These fields are used for frontend display and calculations only.
 * Backend API (Epic 43) does not yet support these fields.
 * TODO: Re-enable when backend implements support
 *       (see docs/request-backend/100-epic-44-open-issues-consolidated.md)
 *
 * Removed fields (Story 44.27 - Warehouse Integration):
 * - warehouse_id
 * - logistics_coefficient
 * - storage_coefficient
 * - delivery_date
 *
 * Removed fields (Story 44.32 - Missing Fields):
 * - weight_exceeds_25kg
 * - localization_index
 *
 * Story 44.36 removes: box_type, turnover_days
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

  // Story 44.37: REMOVED - Backend does not support these fields yet
  // Warehouse & Coefficients (Story 44.27):
  // - warehouse_id, logistics_coefficient, storage_coefficient, delivery_date
  // Additional fields (Story 44.32):
  // - weight_exceeds_25kg, localization_index

  // Story 44.36: REMOVED - Backend does not support these fields yet
  // - box_type, turnover_days

  return baseRequest
}
