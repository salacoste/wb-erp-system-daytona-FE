/**
 * Acceptance Cost Calculation Utilities
 * Acceptance Cost Calculation
 * Story 44.42-FE: Updated to use BoxTypeId
 *
 * WB Paid Acceptance Formula:
 * - Box (2) / Supersafe (6): totalCost = volumeLiters x boxRatePerLiter x coefficient
 * - Pallet (5): totalCost = palletRate x coefficient
 *
 * Reference: docs/request-backend/95-epic-43-price-calculator-api.md
 */

import { isFixedStorageFormula, type BoxTypeId } from '@/lib/box-type-utils'

// Re-export helpers from extracted module
export {
  formatBoxFormula,
  formatPalletFormula,
  formatPerUnitCost,
} from './acceptance-cost-formulas'

import {
  formatBoxFormula,
  formatPalletFormula,
  createZeroResult,
  roundToTwo,
} from './acceptance-cost-formulas'

/** Acceptance tariffs from WB API or admin settings */
export interface AcceptanceTariff {
  /** Rate in rubles per liter for box deliveries */
  boxRatePerLiter: number
  /** Fixed rate in rubles per pallet */
  palletRate: number
}

/** Result of acceptance cost calculation */
export interface AcceptanceCostResult {
  /** Full cost for the package (RUB) */
  totalCost: number
  /** Cost per unit = totalCost / unitsPerPackage (RUB) */
  perUnitCost: number
  /** Human-readable formula for display */
  formula: string
}

/** Default acceptance tariffs (fallback values) */
export const DEFAULT_ACCEPTANCE_TARIFF: AcceptanceTariff = {
  boxRatePerLiter: 1.7,
  palletRate: 500,
}

/**
 * Calculate acceptance cost for box, pallet, or supersafe delivery
 * Story 44.42: Updated to use BoxTypeId (2, 5, 6)
 *
 * @param boxTypeId - Delivery type ID: 2=Boxes, 5=Pallets, 6=Supersafe
 * @param volumeLiters - Package volume in liters (only used for box/supersafe)
 * @param coefficient - Warehouse coefficient (e.g., 1.0, 1.2, 1.5)
 * @param unitsPerPackage - Number of units in the package
 * @param tariff - Acceptance tariffs (box rate per liter, pallet rate)
 * @returns Calculated costs and formula string
 */
export function calculateAcceptanceCost(
  boxTypeId: BoxTypeId,
  volumeLiters: number,
  coefficient: number,
  unitsPerPackage: number,
  tariff: AcceptanceTariff
): AcceptanceCostResult {
  // Handle unavailable acceptance (coefficient = -1)
  if (coefficient === -1) {
    return createZeroResult()
  }

  // Handle coefficient values
  const effectiveCoefficient = coefficient >= 0 && !Number.isNaN(coefficient) ? coefficient : 1.0

  // Pallets (boxTypeId=5) use fixed rate, Boxes (2) and Supersafe (6) use volume-based
  const usesFixedRate = isFixedStorageFormula(boxTypeId)

  // Handle zero/negative volume for volume-based types
  if (!usesFixedRate && volumeLiters <= 0) {
    return createZeroResult()
  }

  let totalCost: number
  let formula: string

  if (usesFixedRate) {
    totalCost = tariff.palletRate * effectiveCoefficient
    formula = formatPalletFormula(tariff.palletRate, effectiveCoefficient, totalCost)
  } else {
    totalCost = volumeLiters * tariff.boxRatePerLiter * effectiveCoefficient
    formula = formatBoxFormula(
      volumeLiters,
      tariff.boxRatePerLiter,
      effectiveCoefficient,
      totalCost
    )
  }

  // Round to 2 decimal places
  totalCost = roundToTwo(totalCost)

  // Calculate per-unit cost (handle division by zero)
  const perUnitCost = unitsPerPackage > 0 ? roundToTwo(totalCost / unitsPerPackage) : totalCost

  return {
    totalCost,
    perUnitCost,
    formula,
  }
}

/**
 * Calculate acceptance cost with default tariffs
 * Story 44.42: Updated to use BoxTypeId
 */
export function calculateAcceptanceCostWithDefaults(
  boxTypeId: BoxTypeId,
  volumeLiters: number,
  coefficient: number,
  unitsPerPackage: number
): AcceptanceCostResult {
  return calculateAcceptanceCost(
    boxTypeId,
    volumeLiters,
    coefficient,
    unitsPerPackage,
    DEFAULT_ACCEPTANCE_TARIFF
  )
}
