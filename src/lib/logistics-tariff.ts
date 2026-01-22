/**
 * Logistics Tariff Calculation Utilities
 * Story 44.8-FE: Logistics Tariff Calculation
 *
 * WB Logistics Formula:
 * logistics_cost = (baseLiterRub + (volume - 1) × additionalLiterRub) × coefficient
 *
 * Reference: docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md
 */

import { formatCurrency } from '@/lib/utils'

/**
 * Box delivery tariffs from WB API
 */
export interface BoxDeliveryTariffs {
  /** First liter base cost (RUB) */
  baseLiterRub: number
  /** Additional liter cost (RUB) */
  additionalLiterRub: number
  /** Warehouse coefficient (normalized: 1.0, 1.25, etc.) */
  coefficient: number
}

/**
 * Logistics tariff breakdown for display
 */
export interface LogisticsTariffBreakdown {
  volumeDisplay: string
  baseRateDisplay: string
  additionalDisplay: string
  coefficientDisplay: string
  totalDisplay: string
}

/**
 * Logistics tariff calculation result
 */
export interface LogisticsTariffResult {
  volumeLiters: number
  baseCost: number
  additionalLitersCost: number
  coefficient: number
  totalCost: number
  breakdown: LogisticsTariffBreakdown
  source: 'warehouse' | 'default' | 'manual'
}

/**
 * Default tariffs (fallback when no warehouse selected)
 * Based on typical WB box tariffs
 * Formula: (baseLiterRub + (volume - 1) × additionalLiterRub) × coefficient
 * Example: 3L = (48 + 2 × 5) × 1.0 = 58
 */
export const DEFAULT_BOX_TARIFFS: BoxDeliveryTariffs = {
  baseLiterRub: 48,
  additionalLiterRub: 5,
  coefficient: 1.0,
}

/**
 * Calculate logistics forward cost using WB formula
 *
 * Formula: (baseLiterRub + (volume - 1) × additionalLiterRub) × coefficient
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

function createBreakdown(
  volume: number,
  baseCost: number,
  additionalLiters: number,
  additionalRate: number,
  coefficient: number,
  total: number
): LogisticsTariffBreakdown {
  const additionalCost = additionalLiters * additionalRate
  return {
    volumeDisplay: `${volume.toFixed(2).replace('.', ',')} л`,
    baseRateDisplay: `${baseCost} ₽ (первый литр)`,
    additionalDisplay:
      additionalLiters > 0
        ? `${additionalLiters.toFixed(1)} л × ${additionalRate} ₽ = ${additionalCost.toFixed(2)} ₽`
        : 'Нет доп. литров',
    coefficientDisplay: `×${coefficient.toFixed(2)}`,
    totalDisplay: formatCurrency(total),
  }
}

function createZeroResult(tariffs: BoxDeliveryTariffs): LogisticsTariffResult {
  return {
    volumeLiters: 0,
    baseCost: 0,
    additionalLitersCost: 0,
    coefficient: tariffs.coefficient || 1.0,
    totalCost: 0,
    breakdown: {
      volumeDisplay: '0,00 л',
      baseRateDisplay: '—',
      additionalDisplay: '—',
      coefficientDisplay: '—',
      totalDisplay: '0,00 ₽',
    },
    source: 'default',
  }
}

/**
 * Parse WB tariff expression (e.g., "48*1", "5*x")
 * Returns the numeric value before the multiplier
 */
export function parseTariffExpression(expr: string): number {
  const match = expr.match(/^(\d+)\*/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Normalize WB coefficient (integer 100 → decimal 1.0)
 */
export function normalizeCoefficient(coefficient: number): number {
  // WB returns 100 for 1.0, 125 for 1.25, etc.
  return coefficient / 100
}

/**
 * Denormalize coefficient for API (decimal → integer)
 */
export function denormalizeCoefficient(coefficient: number): number {
  return Math.round(coefficient * 100)
}

/**
 * Calculate logistics with default tariffs
 */
export function calculateWithDefaultTariffs(volumeLiters: number): LogisticsTariffResult {
  const result = calculateLogisticsTariff(volumeLiters, DEFAULT_BOX_TARIFFS)
  return { ...result, source: 'default' }
}
