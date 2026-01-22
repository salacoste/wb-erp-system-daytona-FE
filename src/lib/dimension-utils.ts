/**
 * Dimension and Volume Calculation Utilities
 * Story 44.7-FE: Dimension-Based Volume Calculation
 * Story 44.26b-FE: Auto-fill Dimensions & Category
 *
 * WB Cargo Type Reference:
 * - MGT (Малогабаритный): max dimension ≤ 60 cm
 * - SGT (Среднегабаритный): max dimension ≤ 120 cm
 * - KGT (Крупногабаритный): max dimension > 120 cm (requires manual tariff input)
 */

/** Product dimensions in centimeters */
export interface ProductDimensions {
  length_cm: number
  width_cm: number
  height_cm: number
}

/** Cargo type based on max dimension */
export type CargoType = 'MGT' | 'SGT' | 'KGT'

/** Cargo type configuration */
export interface CargoTypeConfig {
  code: CargoType
  label: string
  labelFull: string
  maxDimension: number
  color: 'green' | 'yellow' | 'red'
  bgColor: string
  textColor: string
  isError: boolean
}

/** Volume tier configuration */
export interface VolumeTierConfig {
  tier: 'small' | 'standard' | 'large'
  label: string
  color: 'green' | 'yellow' | 'orange'
  minVolume: number
  maxVolume: number
}

/** Cargo type configurations */
export const CARGO_TYPE_CONFIG: Record<CargoType, CargoTypeConfig> = {
  MGT: {
    code: 'MGT',
    label: 'МГТ',
    labelFull: 'Малогабаритный товар (до 60 см)',
    maxDimension: 60,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    isError: false,
  },
  SGT: {
    code: 'SGT',
    label: 'СГТ',
    labelFull: 'Среднегабаритный товар (до 120 см)',
    maxDimension: 120,
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    isError: false,
  },
  KGT: {
    code: 'KGT',
    label: 'КГТ',
    labelFull: 'Крупногабаритный товар (более 120 см)',
    maxDimension: Infinity,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    isError: true,
  },
}

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
export function getCargoTypeConfig(cargoType: CargoType): CargoTypeConfig {
  return CARGO_TYPE_CONFIG[cargoType]
}

/**
 * Get volume tier based on volume in liters
 */
export function getVolumeTier(volumeLiters: number): VolumeTierConfig {
  if (volumeLiters <= 1) {
    return {
      tier: 'small',
      label: 'Малый объём',
      color: 'green',
      minVolume: 0,
      maxVolume: 1,
    }
  }
  if (volumeLiters <= 30) {
    return {
      tier: 'standard',
      label: 'Стандартный объём',
      color: 'yellow',
      minVolume: 1,
      maxVolume: 30,
    }
  }
  return {
    tier: 'large',
    label: 'Большой объём',
    color: 'orange',
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
  return (
    dimensions.length_cm > 0 &&
    dimensions.width_cm > 0 &&
    dimensions.height_cm > 0
  )
}

// ============================================================================
// Unit Conversion Utilities (Story 44.26b)
// ============================================================================

/**
 * Convert millimeters to centimeters
 * Used for auto-fill from product dimensions (backend returns mm)
 *
 * @param mm - Value in millimeters
 * @returns Value in centimeters (mm / 10)
 *
 * @example
 * mmToCm(400) // returns 40
 * mmToCm(255) // returns 25.5
 */
export function mmToCm(mm: number): number {
  return mm / 10
}

/**
 * Convert centimeters to millimeters
 * Used when sending dimensions back to API (if needed)
 *
 * @param cm - Value in centimeters
 * @returns Value in millimeters (cm * 10)
 */
export function cmToMm(cm: number): number {
  return cm * 10
}
