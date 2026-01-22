/**
 * Return Logistics Calculation Utilities
 * Story 44.10-FE: Return Logistics Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Business Logic (Story 44.10):
 * - base_return = forward_logistics (same tariff per WB rules)
 * - effective_return = base_return × (100 - buyback_pct) / 100
 *
 * Example:
 * - Forward logistics: 72.50 ₽
 * - Buyback: 98% (typical WB value)
 * - Return rate: 100 - 98 = 2%
 * - Effective return: 72.50 × 0.02 = 1.45 ₽
 */

// ============================================================================
// Local Currency Formatter (2 decimal places for consistency)
// ============================================================================

/**
 * Format currency with exactly 2 decimal places
 * Uses Russian locale formatting (e.g., "72,50 ₽")
 */
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
// Legacy Types (Backward Compatibility)
// ============================================================================

/** @deprecated Use new API - Input parameters for return logistics calculation */
export interface ReturnLogisticsParams {
  logisticsToCustomer: number
  buybackRate: number
}

/** @deprecated Use ReturnLogisticsResult - Legacy result interface */
export interface LegacyReturnLogisticsResult {
  logisticsToCustomer: number
  buybackRate: number
  returnRate: number
  returnLogisticsCost: number
}

/** @deprecated Use ReturnLogisticsBreakdown - Legacy breakdown interface */
export interface LegacyReturnLogisticsBreakdown {
  logisticsToCustomer: number
  buybackRate: number
  returnRate: number
  returnLogisticsCost: number
  formula: string
}

// ============================================================================
// Constants
// ============================================================================

/** Threshold for high return rate warning (%) */
const HIGH_RETURN_RATE_THRESHOLD = 15

/** Low return rate threshold for green color (%) */
const LOW_RETURN_RATE_THRESHOLD = 5

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

/**
 * Calculates return rate from buyback rate
 * return_rate = 100 - buyback_rate (clamped to 0-100)
 */
export function calculateReturnRate(buybackRate: number): number {
  const clampedBuyback = clamp(buybackRate, 0, 100)
  return 100 - clampedBuyback
}

// ============================================================================
// Story 44.10 TDD Functions
// ============================================================================

/**
 * Calculates base return logistics (equals forward logistics per WB rules)
 * Story 44.10: base_return = forward_logistics
 */
export function calculateBaseReturnLogistics(forwardLogistics: number): number {
  return forwardLogistics < 0 ? 0 : forwardLogistics
}

/**
 * Calculates effective return after buyback percentage
 * Story 44.10: effective_return = base_return × (100 - buyback_pct) / 100
 */
export function calculateEffectiveReturn(
  baseReturn: number,
  buybackPct: number
): number {
  if (baseReturn < 0) return 0
  const clampedBuyback = clamp(buybackPct, 0, 100)
  const returnRatePct = 100 - clampedBuyback
  return roundTo(baseReturn * (returnRatePct / 100), 2)
}

/**
 * Checks if manual value differs significantly from calculated value
 * Story 44.10: Default threshold is 50%
 */
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

/**
 * Main calculation function for return logistics (Story 44.10 TDD API)
 * Returns complete result with breakdown for display
 */
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
      buybackDisplay: `${clampedBuyback}%`,
      returnRateDisplay: `${returnRatePct}%`,
      effectiveReturnDisplay: formatCurrencyFixed(effectiveReturn),
    },
  }
}

// ============================================================================
// Legacy API (Backward Compatibility)
// ============================================================================

/**
 * @deprecated Use calculateReturnLogistics(forwardLogistics, buybackPct) instead
 * Legacy calculation function for return logistics cost
 */
export function calculateReturnLogisticsLegacy(
  params: ReturnLogisticsParams
): LegacyReturnLogisticsResult {
  const { logisticsToCustomer, buybackRate } = params

  if (logisticsToCustomer < 0) {
    return {
      logisticsToCustomer,
      buybackRate,
      returnRate: calculateReturnRate(buybackRate),
      returnLogisticsCost: 0,
    }
  }

  const clampedBuybackRate = clamp(buybackRate, 0, 100)
  const returnRate = calculateReturnRate(clampedBuybackRate)
  const returnLogisticsCost = roundTo(logisticsToCustomer * (returnRate / 100), 2)

  return {
    logisticsToCustomer,
    buybackRate: clampedBuybackRate,
    returnRate,
    returnLogisticsCost,
  }
}

// ============================================================================
// Display Helper Functions
// ============================================================================

/**
 * @deprecated Use calculateReturnLogistics().breakdown instead
 * Returns detailed breakdown object for tooltip/display
 */
export function getReturnLogisticsBreakdown(
  logisticsToCustomer: number,
  buybackRate: number
): LegacyReturnLogisticsBreakdown {
  const result = calculateReturnLogisticsLegacy({ logisticsToCustomer, buybackRate })

  const formula = `${result.logisticsToCustomer} × ${result.returnRate}% = ${result.returnLogisticsCost}`

  return {
    logisticsToCustomer: result.logisticsToCustomer,
    buybackRate: result.buybackRate,
    returnRate: result.returnRate,
    returnLogisticsCost: result.returnLogisticsCost,
    formula,
  }
}

/**
 * Formats tooltip text in Russian for return logistics display
 */
export function formatReturnLogisticsTooltip(
  logisticsToCustomer: number,
  buybackRate: number,
  returnCost: number
): string {
  const returnRate = calculateReturnRate(buybackRate)

  return [
    `Логистика к клиенту: ${logisticsToCustomer} ₽`,
    `Процент выкупа: ${buybackRate}%`,
    `Процент возврата: ${returnRate}%`,
    `Логистика возврата: ${returnCost} ₽`,
  ].join('\n')
}

// ============================================================================
// Status Helper Functions
// ============================================================================

/**
 * Checks if return rate is considered high (warning threshold)
 * High = return rate > 15%
 */
export function isHighReturnRate(returnRate: number): boolean {
  return returnRate > HIGH_RETURN_RATE_THRESHOLD
}

/**
 * Returns Tailwind color class based on return rate
 * - Green: < 5% (excellent buyback)
 * - Yellow: 5-15% (normal)
 * - Red: > 15% (high returns, warning)
 */
export function getReturnRateColor(returnRate: number): string {
  if (returnRate < LOW_RETURN_RATE_THRESHOLD) {
    return 'text-green-600'
  }
  if (returnRate <= HIGH_RETURN_RATE_THRESHOLD) {
    return 'text-yellow-600'
  }
  return 'text-red-600'
}
