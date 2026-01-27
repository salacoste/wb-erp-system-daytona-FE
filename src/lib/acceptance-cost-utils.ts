/**
 * Acceptance Cost Calculation Utilities
 * Story 44.XX-FE: Acceptance Cost Calculation
 * Story 44.42-FE: Updated to use BoxTypeId
 *
 * WB Paid Acceptance Formula:
 * - Box (2) / Supersafe (6): totalCost = volumeLiters × boxRatePerLiter × coefficient
 * - Pallet (5): totalCost = palletRate × coefficient
 *
 * Reference: docs/request-backend/95-epic-43-price-calculator-api.md
 */

import { formatCurrency } from '@/lib/utils'
import { isFixedStorageFormula, type BoxTypeId } from '@/lib/box-type-utils'

/**
 * Acceptance tariffs from WB API or admin settings
 */
export interface AcceptanceTariff {
  /** Rate in rubles per liter for box deliveries */
  boxRatePerLiter: number
  /** Fixed rate in rubles per pallet */
  palletRate: number
}

/**
 * Result of acceptance cost calculation
 */
export interface AcceptanceCostResult {
  /** Full cost for the package (RUB) */
  totalCost: number
  /** Cost per unit = totalCost / unitsPerPackage (RUB) */
  perUnitCost: number
  /** Human-readable formula for display */
  formula: string
}

/**
 * Default acceptance tariffs (fallback values)
 * Based on typical WB acceptance rates
 */
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
 *
 * @example
 * // Box calculation (boxTypeId=2)
 * calculateAcceptanceCost(2, 5.0, 1.2, 10, { boxRatePerLiter: 1.7, palletRate: 500 })
 * // Result: { totalCost: 10.20, perUnitCost: 1.02, formula: "5.00 л × 1.70 ₽/л × 1.20 = 10.20 ₽" }
 *
 * @example
 * // Pallet calculation (boxTypeId=5)
 * calculateAcceptanceCost(5, 0, 1.0, 100, { boxRatePerLiter: 1.7, palletRate: 500 })
 * // Result: { totalCost: 500.00, perUnitCost: 5.00, formula: "500.00 ₽ × 1.00 = 500.00 ₽" }
 */
export function calculateAcceptanceCost(
  boxTypeId: BoxTypeId,
  volumeLiters: number,
  coefficient: number,
  unitsPerPackage: number,
  tariff: AcceptanceTariff
): AcceptanceCostResult {
  // Handle unavailable acceptance (coefficient = -1) - return zero result
  // WB uses -1 to indicate acceptance is not available at this warehouse
  if (coefficient === -1) {
    return createZeroResult()
  }

  // Handle coefficient values:
  // - 0 = free acceptance (cost multiplier is 0, resulting in zero cost)
  // - 1.0 = standard rate
  // - >1 = surcharge (e.g., 1.5 = 50% higher cost)
  // - undefined/null/NaN/negative (except -1) = invalid, fallback to 1.0
  const effectiveCoefficient =
    coefficient >= 0 && !Number.isNaN(coefficient) ? coefficient : 1.0

  // Pallets (boxTypeId=5) use fixed rate, Boxes (2) and Supersafe (6) use volume-based
  const usesFixedRate = isFixedStorageFormula(boxTypeId)

  // Handle zero/negative volume for volume-based types
  if (!usesFixedRate && volumeLiters <= 0) {
    return createZeroResult()
  }

  let totalCost: number
  let formula: string

  if (usesFixedRate) {
    // Pallet formula: palletRate × coefficient
    totalCost = tariff.palletRate * effectiveCoefficient
    formula = formatPalletFormula(tariff.palletRate, effectiveCoefficient, totalCost)
  } else {
    // Box/Supersafe formula: volumeLiters × boxRatePerLiter × coefficient
    totalCost = volumeLiters * tariff.boxRatePerLiter * effectiveCoefficient
    formula = formatBoxFormula(volumeLiters, tariff.boxRatePerLiter, effectiveCoefficient, totalCost)
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
 * Format box calculation formula for display
 * Example: "5.00 л × 1.70 ₽/л × 1.20 = 10.20 ₽"
 */
function formatBoxFormula(
  volume: number,
  rate: number,
  coefficient: number,
  total: number
): string {
  const volumeStr = volume.toFixed(2).replace('.', ',')
  const rateStr = rate.toFixed(2).replace('.', ',')
  const coeffStr = coefficient.toFixed(2).replace('.', ',')
  const totalStr = formatCurrency(total)

  return `${volumeStr} л × ${rateStr} ₽/л × ${coeffStr} = ${totalStr}`
}

/**
 * Format pallet calculation formula for display
 * Example: "500.00 ₽ × 1.00 = 500.00 ₽"
 */
function formatPalletFormula(rate: number, coefficient: number, total: number): string {
  const rateStr = rate.toFixed(2).replace('.', ',')
  const coeffStr = coefficient.toFixed(2).replace('.', ',')
  const totalStr = formatCurrency(total)

  return `${rateStr} ₽ × ${coeffStr} = ${totalStr}`
}

/**
 * Create zero result for invalid inputs
 */
function createZeroResult(): AcceptanceCostResult {
  return {
    totalCost: 0,
    perUnitCost: 0,
    formula: '—',
  }
}

/**
 * Round number to 2 decimal places
 */
function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Calculate acceptance cost with default tariffs
 * Story 44.42: Updated to use BoxTypeId
 *
 * @param boxTypeId - Delivery type ID: 2=Boxes, 5=Pallets, 6=Supersafe
 * @param volumeLiters - Package volume in liters
 * @param coefficient - Warehouse coefficient
 * @param unitsPerPackage - Number of units in the package
 * @returns Calculated costs using default tariffs
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

/**
 * Format per-unit cost for display with units label
 *
 * @param perUnitCost - Cost per unit in rubles
 * @param unitsPerPackage - Number of units for context
 * @returns Formatted string like "1.02 ₽/шт"
 */
export function formatPerUnitCost(perUnitCost: number, unitsPerPackage: number): string {
  if (unitsPerPackage <= 0) {
    return '—'
  }
  return `${formatCurrency(perUnitCost)}/шт`
}
