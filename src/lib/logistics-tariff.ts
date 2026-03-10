/**
 * Logistics Tariff Calculation Utilities
 * Story 44.8-FE: Logistics Tariff Calculation
 *
 * WB Logistics Formula:
 * logistics_cost = (baseLiterRub + (volume - 1) x additionalLiterRub) x coefficient
 *
 * Reference: docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md
 */

// Re-export types, constants, and helpers from extracted module
export type {
  BoxDeliveryTariffs,
  LogisticsTariffBreakdown,
  LogisticsTariffResult,
} from './logistics-tariff-helpers'
export {
  DEFAULT_BOX_TARIFFS,
  DEFAULT_RETURN_TARIFFS,
  parseTariffExpression,
  normalizeCoefficient,
  denormalizeCoefficient,
} from './logistics-tariff-helpers'

import type { BoxDeliveryTariffs } from './logistics-tariff-helpers'
import {
  DEFAULT_BOX_TARIFFS,
  DEFAULT_RETURN_TARIFFS,
  createBreakdown,
  createZeroResult,
} from './logistics-tariff-helpers'
import type { LogisticsTariffResult } from './logistics-tariff-helpers'

/**
 * Calculate logistics forward cost using WB formula
 *
 * Formula: (baseLiterRub + (volume - 1) x additionalLiterRub) x coefficient
 *
 * @param volumeLiters - Product volume in liters (from Story 44.7)
 * @param tariffs - Box delivery tariffs (from warehouse or default)
 * @returns Calculated logistics cost and breakdown
 */
export function calculateLogisticsTariff(
  volumeLiters: number,
  tariffs: BoxDeliveryTariffs
): LogisticsTariffResult {
  if (volumeLiters <= 0) {
    return createZeroResult(tariffs)
  }

  // For volumes less than 1L, still charge minimum 1L
  const effectiveVolume = Math.max(1, volumeLiters)

  // Calculate additional liters (first liter is included in base)
  const additionalLiters = Math.max(0, effectiveVolume - 1)

  // Base cost for first liter
  const baseCost = tariffs.baseLiterRub

  // Cost for additional liters
  const additionalLitersCost = additionalLiters * tariffs.additionalLiterRub

  // Total before coefficient
  const subtotal = baseCost + additionalLitersCost

  // Apply warehouse coefficient (use 1.0 if 0 or invalid)
  const effectiveCoefficient = tariffs.coefficient > 0 ? tariffs.coefficient : 1.0
  const totalCost = subtotal * effectiveCoefficient

  // Round to 2 decimal places
  const finalCost = Math.round(totalCost * 100) / 100

  return {
    volumeLiters,
    baseCost,
    additionalLitersCost: Math.round(additionalLitersCost * 100) / 100,
    coefficient: effectiveCoefficient,
    totalCost: finalCost,
    breakdown: createBreakdown(
      volumeLiters,
      baseCost,
      additionalLiters,
      tariffs.additionalLiterRub,
      effectiveCoefficient,
      finalCost
    ),
    source: 'warehouse',
  }
}

/** Calculate logistics with default tariffs */
export function calculateWithDefaultTariffs(volumeLiters: number): LogisticsTariffResult {
  const result = calculateLogisticsTariff(volumeLiters, DEFAULT_BOX_TARIFFS)
  return { ...result, source: 'default' }
}

/**
 * Calculate return logistics cost
 * Formula: baseLiterRub + (volume - 1) x additionalLiterRub
 *
 * @param volumeLiters - Product volume in liters
 * @param tariffs - Return logistics tariffs (default: 50 + 25 per liter)
 * @returns Calculated return logistics cost in RUB
 */
export function calculateReturnLogistics(
  volumeLiters: number,
  tariffs = DEFAULT_RETURN_TARIFFS
): number {
  if (volumeLiters <= 0) return 0

  // Minimum 1 liter
  const effectiveVolume = Math.max(1, volumeLiters)
  const additionalLiters = Math.max(0, effectiveVolume - 1)

  const total = tariffs.baseLiterRub + additionalLiters * tariffs.additionalLiterRub
  return Math.round(total * 100) / 100
}
