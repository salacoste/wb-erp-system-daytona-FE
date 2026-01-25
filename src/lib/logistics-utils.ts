/**
 * Logistics Utilities - Backend Requirements
 * Story 44.14-FE: Logistics Configuration Auto-fill
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Functions for managing WB logistics forward and reverse costs with cargo type validation.
 *
 * CRITICAL CONSTRAINT: Reverse logistics is NEVER auto-filled - users must enter manually.
 * Reverse logistics costs are only calculated with buyback adjustment.
 *
 * @see docs/request-backend/102-tariffs-base-rates-frontend-guide.md
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
export function determineCargoType(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
): CargoType {
  // Find maximum dimension
  const maxDimension = Math.max(lengthCm, widthCm, heightCm)

  // Classify by threshold
  if (maxDimension <= 60) {
    return 'MGT'
  } else if (maxDimension <= 120) {
    return 'SGT'
  } else {
    return 'KGT'
  }
}

/**
 * Check if forward logistics can be auto-filled based on warehouse and dimensions
 *
 * Auto-fill requirements:
 * 1. Warehouse name must be provided and non-empty
 * 2. Either volume (liters) OR all three dimensions must be provided
 * 3. Cargo type must NOT be KGT (oversized items require manual entry)
 *
 * @param params - Auto-fill parameters
 * @returns Auto-fill result with canAutoFill flag and reason if blocked
 */
export function canAutoFillForwardLogistics(
  params: AutoFillParams,
): AutoFillResult {
  // Check warehouse is provided and non-empty
  if (!params.warehouseName || params.warehouseName.trim() === '') {
    return {
      canAutoFill: false,
      reason: 'Укажите склад для автозаполнения логистики',
    }
  }

  // Check either volume or dimensions are provided
  const hasVolume = params.volumeLiters !== undefined && params.volumeLiters > 0
  const hasDimensions =
    params.dimensions !== undefined &&
    params.dimensions.lengthCm > 0 &&
    params.dimensions.widthCm > 0 &&
    params.dimensions.heightCm > 0

  if (!hasVolume && !hasDimensions) {
    return {
      canAutoFill: false,
      reason: 'Укажите объём или размеры товара для автозаполнения логистики',
    }
  }

  // If dimensions provided, determine cargo type and check for KGT
  if (hasDimensions && params.dimensions) {
    const cargoType = determineCargoType(
      params.dimensions.lengthCm,
      params.dimensions.widthCm,
      params.dimensions.heightCm,
    )

    if (cargoType === 'KGT') {
      return {
        canAutoFill: false,
        cargoType,
        reason: 'KGT товары требуют ручного ввода логистики (превышена максимальная длина 120 см)',
      }
    }

    // MGT or SGT cargo with valid dimensions
    return {
      canAutoFill: true,
      cargoType,
    }
  }

  // Volume provided without dimensions - can auto-fill
  return {
    canAutoFill: true,
  }
}

/**
 * Calculate effective reverse logistics cost with buyback adjustment
 *
 * Formula: effective = reverseLogistics × (1 - buybackPct / 100)
 *
 * CRITICAL: This function ONLY CALCULATES the adjustment.
 * Reverse logistics is NEVER auto-filled - users must enter the base reverse cost manually.
 * This function is only used to show the effective cost after buyback adjustment.
 *
 * Example:
 * - Reverse logistics: 72.50 RUB
 * - Buyback percentage: 98%
 * - Effective cost: 72.50 × (1 - 0.98) = 72.50 × 0.02 = 1.45 RUB
 *
 * @param reverseLogisticsRub - Reverse logistics cost in RUB (must be manually entered)
 * @param buybackPct - Buyback percentage (0-100%)
 * @returns Effective reverse logistics cost in RUB after buyback adjustment
 */
export function calculateEffectiveReverseLogistics(
  reverseLogisticsRub: number,
  buybackPct: number,
): number {
  // Handle invalid inputs
  if (reverseLogisticsRub <= 0) {
    return 0
  }

  // Clamp buyback percentage to 0-100% range
  const clampedBuyback = Math.max(0, Math.min(100, buybackPct))

  // Apply formula: effective = reverse × (1 - buyback%)
  const effectiveMultiplier = 1 - clampedBuyback / 100
  return reverseLogisticsRub * effectiveMultiplier
}
