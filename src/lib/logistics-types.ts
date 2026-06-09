/**
 * Logistics Types & Cargo Classification
 * Extracted from logistics-utils.ts for file-size compliance.
 * Story 44.14-FE: Logistics Configuration Auto-fill
 */

/**
 * Cargo type classification based on maximum dimension
 * - MGT: Small parcels (max dimension ≤ 60cm)
 * - SGT: Medium parcels (max dimension > 60cm and ≤ 120cm)
 * - KGT: Large oversized parcels (max dimension > 120cm) - requires manual input
 */
export type CargoType = 'MGT' | 'SGT' | 'KGT'

/**
 * Parameters for forward logistics auto-fill evaluation
 */
export interface AutoFillParams {
  /** Warehouse name (required for auto-fill) */
  warehouseName?: string
  /** Product volume in liters (alternative to dimensions) */
  volumeLiters?: number
  /** Product dimensions in centimeters */
  dimensions?: {
    lengthCm: number
    widthCm: number
    heightCm: number
  }
}

/**
 * Result of forward logistics auto-fill evaluation
 */
export interface AutoFillResult {
  /** Whether forward logistics can be auto-filled */
  canAutoFill: boolean
  /** Reason if cannot auto-fill (warehouse missing, KGT cargo, etc.) */
  reason?: string
  /** Determined cargo type (if dimensions provided) */
  cargoType?: CargoType
}

/**
 * Determine cargo type from product dimensions
 *
 * Classification:
 * - MGT: max dimension ≤ 60cm (small parcels)
 * - SGT: max dimension > 60cm and ≤ 120cm (medium parcels)
 * - KGT: max dimension > 120cm (oversized - requires manual input)
 *
 * @param lengthCm - Length in centimeters
 * @param widthCm - Width in centimeters
 * @param heightCm - Height in centimeters
 * @returns Cargo type classification (MGT, SGT, or KGT)
 */
export function determineCargoType(lengthCm: number, widthCm: number, heightCm: number): CargoType {
  const maxDimension = Math.max(lengthCm, widthCm, heightCm)

  if (maxDimension <= 60) {
    return 'MGT'
  } else if (maxDimension <= 120) {
    return 'SGT'
  } else {
    return 'KGT'
  }
}
