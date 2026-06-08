/**
 * Dimension Types, Constants & Conversion Utilities
 * Extracted from dimension-utils.ts for file size compliance
 * Story 44.7-FE / Story 44.26b-FE
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
