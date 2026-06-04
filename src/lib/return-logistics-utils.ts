/**
 * Return Logistics Calculation Utilities
 * Story 44.10-FE: Return Logistics Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Business Logic (Story 44.10):
 * - base_return = forward_logistics (same tariff per WB rules)
 * - effective_return = base_return x (100 - buyback_pct) / 100
 *
 * Example:
 * - Forward logistics: 72.50 rub
 * - Buyback: 98% (typical WB value)
 * - Return rate: 100 - 98 = 2%
 * - Effective return: 72.50 x 0.02 = 1.45 rub
 */

import { formatPercentage } from '@/lib/utils'

// ============================================================================
// Local Currency Formatter (2 decimal places for consistency)
// ============================================================================

/** Format currency with exactly 2 decimal places (Russian locale) */
function formatCurrencyFixed(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// ============================================================================
// Types - Story 44.10 TDD Interface
// ============================================================================

/** Breakdown object for display formatting (Story 44.10) */
export interface ReturnLogisticsBreakdown {
  baseReturnDisplay: string
  buybackDisplay: string
  returnRateDisplay: string
  effectiveReturnDisplay: string
}

/** Result of return logistics calculation (Story 44.10) */
export interface ReturnLogisticsResult {
  baseReturn: number
  effectiveReturn: number
  buybackPct: number
  returnRatePct: number
  breakdown: ReturnLogisticsBreakdown
}

// ============================================================================
// Core Calculation Functions
// ============================================================================

/** Clamps a value to a min-max range */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Rounds a number to specified decimal places */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/** Calculates return rate from buyback rate */
export function calculateReturnRate(buybackRate: number): number {
  const clampedBuyback = clamp(buybackRate, 0, 100)
  return 100 - clampedBuyback
}

// ============================================================================
// Story 44.10 TDD Functions
// ============================================================================

/** Calculates base return logistics (equals forward logistics per WB rules) */
export function calculateBaseReturnLogistics(forwardLogistics: number): number {
  return forwardLogistics < 0 ? 0 : forwardLogistics
}

/** Calculates effective return after buyback percentage */
export function calculateEffectiveReturn(baseReturn: number, buybackPct: number): number {
  if (baseReturn < 0) return 0
  const clampedBuyback = clamp(buybackPct, 0, 100)
  const returnRatePct = 100 - clampedBuyback
  return roundTo(baseReturn * (returnRatePct / 100), 2)
}

/** Checks if manual value differs significantly from calculated value */
export function hasSignificantDifference(
  manualValue: number,
  calculatedValue: number,
  thresholdPct: number = 50
): boolean {
  if (calculatedValue === 0) {
    return manualValue > 0
  }
  const difference = Math.abs(manualValue - calculatedValue)
  const percentDiff = (difference / calculatedValue) * 100
  return percentDiff > thresholdPct
}

/** Main calculation function for return logistics (Story 44.10 TDD API) */
export function calculateReturnLogistics(
  forwardLogistics: number,
  buybackPct: number
): ReturnLogisticsResult {
  const baseReturn = calculateBaseReturnLogistics(forwardLogistics)
  const clampedBuyback = clamp(buybackPct, 0, 100)
  const returnRatePct = 100 - clampedBuyback
  const effectiveReturn = calculateEffectiveReturn(baseReturn, clampedBuyback)

  return {
    baseReturn,
    effectiveReturn,
    buybackPct: clampedBuyback,
    returnRatePct,
    breakdown: {
      baseReturnDisplay: formatCurrencyFixed(baseReturn),
      // buyback is fractional-capable (e.g. 98.5 → returnRate 1.5) → formatPercentage(_, 1) (NBSP),
      // consistent with ReturnLogisticsCalculator/Section; NO *100 (already percent-units 0-100)
      buybackDisplay: formatPercentage(clampedBuyback, 1),
      returnRateDisplay: formatPercentage(returnRatePct, 1),
      effectiveReturnDisplay: formatCurrencyFixed(effectiveReturn),
    },
  }
}
