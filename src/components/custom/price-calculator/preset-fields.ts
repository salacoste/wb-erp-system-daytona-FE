/**
 * Price Calculator Preset Fields
 * Extracted from usePriceCalculatorPreset for max-lines compliance
 *
 * Form fields to include in preset (AC6):
 * Includes: All user-editable fields
 * Excludes: Calculated values, API-fetched coefficients, delivery_date (changes daily)
 */

import type { FormData } from './usePriceCalculatorForm'

/**
 * Preset fields whitelist — only these form fields are persisted to localStorage.
 */
export const PRESET_FIELDS: (keyof FormData)[] = [
  // Product selection
  'nm_id',
  'category_id',

  // Cost inputs
  'cogs_rub',
  'target_margin_pct',

  // Fulfillment & warehouse
  'fulfillment_type',
  'warehouse_id',
  'warehouse_name',
  'box_type',

  // Dimensions
  'length_cm',
  'width_cm',
  'height_cm',
  'weight_exceeds_25kg',

  // Tax configuration (налоги)
  'tax_rate_pct',
  'tax_type',
  'is_vat_payer',
  'vat_pct',

  // Percentage costs
  'drr_pct',
  'spp_pct',
  'buyback_pct',
  'acquiring_pct',

  // FBO settings
  'turnover_days',
  'units_per_package',

  // Seller costs (Story 44.50)
  'packaging_rub',
  'logistics_to_mp_rub',
]
