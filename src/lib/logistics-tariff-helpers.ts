/**
 * Logistics Tariff Types, Defaults, and Helper Functions
 * Story 44.8-FE: Logistics Tariff Calculation
 *
 * Extracted from logistics-tariff.ts for file size compliance.
 * Contains type definitions, default tariffs, breakdown/zero-result
 * creators, and coefficient conversion helpers.
 *
 * Reference: docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md
 */

import { formatCurrency, formatDecimal } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Constants
// ============================================================================

/**
 * Default tariffs (fallback when no warehouse selected)
 * Values from /v1/tariffs/settings API defaults
 * Formula: (baseLiterRub + (volume - 1) x additionalLiterRub) x coefficient
 * Example: 3L = (46 + 2 x 14) x 1.0 = 74
 */
export const DEFAULT_BOX_TARIFFS: BoxDeliveryTariffs = {
  baseLiterRub: 46,
  additionalLiterRub: 14,
  coefficient: 1.0,
}

/**
 * Default return logistics tariffs
 * Base rate: 50 RUB for first liter
 * Additional: 25 RUB per each additional liter
 */
export const DEFAULT_RETURN_TARIFFS = {
  baseLiterRub: 50,
  additionalLiterRub: 25,
}

// ============================================================================
// Breakdown and Helper Functions
// ============================================================================

export function createBreakdown(
  volume: number,
  baseCost: number,
  additionalLiters: number,
  additionalRate: number,
  coefficient: number,
  total: number
): LogisticsTariffBreakdown {
  const additionalCost = additionalLiters * additionalRate
  return {
    volumeDisplay: `${formatDecimal(volume, 2)} л`,
    baseRateDisplay: `${baseCost} ₽ (первый литр)`,
    additionalDisplay:
      additionalLiters > 0
        ? `${formatDecimal(additionalLiters, 1)} л × ${additionalRate} ₽ = ${formatDecimal(additionalCost, 2)} ₽`
        : 'Нет доп. литров',
    coefficientDisplay: `×${formatDecimal(coefficient, 2)}`,
    totalDisplay: formatCurrency(total),
  }
}

export function createZeroResult(tariffs: BoxDeliveryTariffs): LogisticsTariffResult {
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
 * Normalize WB coefficient (integer 100 -> decimal 1.0)
 */
export function normalizeCoefficient(coefficient: number): number {
  // WB returns 100 for 1.0, 125 for 1.25, etc.
  return coefficient / 100
}

/**
 * Denormalize coefficient for API (decimal -> integer)
 */
export function denormalizeCoefficient(coefficient: number): number {
  return Math.round(coefficient * 100)
}
