/**
 * Dimension and Volume Calculation Utilities
 * Story 44.7-FE: Dimension-Based Volume Calculation
 * Story 44.26b-FE: Auto-fill Dimensions & Category
 *
 * Types, constants, and conversion helpers extracted to dimension-types.ts
 */

export type {
  ProductDimensions,
  CargoType,
  CargoTypeConfig,
  VolumeTierConfig,
} from './dimension-types'
export { CARGO_TYPE_CONFIG, mmToCm, cmToMm } from './dimension-types'

import type { ProductDimensions, CargoType } from './dimension-types'
import { CARGO_TYPE_CONFIG } from './dimension-types'

/**
 * Calculate volume in liters from dimensions in cm
 * Formula: (L × W × H) / 1000
 */
export function calculateVolumeLiters(dimensions: ProductDimensions): number {
  const { length_cm, width_cm, height_cm } = dimensions
  if (length_cm <= 0 || width_cm <= 0 || height_cm <= 0) {
    return 0
  }
  const volumeCm3 = length_cm * width_cm * height_cm
  // Round to 3 decimal places
  return Math.round((volumeCm3 / 1000) * 1000) / 1000
}

/**
 * Detect cargo type based on maximum dimension (WB rules)
 */
export function detectCargoType(dimensions: ProductDimensions): CargoType {
  const maxDimension = getMaxDimension(dimensions)
  if (maxDimension <= 60) return 'MGT'
  if (maxDimension <= 120) return 'SGT'
  return 'KGT'
}

/**
 * Get maximum dimension from product dimensions
 */
export function getMaxDimension(dimensions: ProductDimensions): number {
  return Math.max(dimensions.length_cm, dimensions.width_cm, dimensions.height_cm)
}

/**
 * Check if cargo type is KGT (requires manual tariff input)
 */
export function isKgtCargo(dimensions: ProductDimensions): boolean {
  return detectCargoType(dimensions) === 'KGT'
}

/**
 * Get cargo type configuration
 */
export function getCargoTypeConfig(cargoType: CargoType) {
  return CARGO_TYPE_CONFIG[cargoType]
}

/**
 * Get volume tier based on volume in liters
 */
export function getVolumeTier(volumeLiters: number) {
  if (volumeLiters <= 1) {
    return {
      tier: 'small' as const,
      label: 'Малый объём',
      color: 'green' as const,
      minVolume: 0,
      maxVolume: 1,
    }
  }
  if (volumeLiters <= 30) {
    return {
      tier: 'standard' as const,
      label: 'Стандартный объём',
      color: 'yellow' as const,
      minVolume: 1,
      maxVolume: 30,
    }
  }
  return {
    tier: 'large' as const,
    label: 'Большой объём',
    color: 'orange' as const,
    minVolume: 30,
    maxVolume: Infinity,
  }
}

/**
 * Format volume for display (Russian locale)
 */
export function formatVolume(volumeLiters: number): string {
  return `${volumeLiters.toFixed(3).replace('.', ',')} л`
}

/**
 * Check if all dimensions are provided and valid
 */
export function hasValidDimensions(dimensions: ProductDimensions): boolean {
  return dimensions.length_cm > 0 && dimensions.width_cm > 0 && dimensions.height_cm > 0
}
