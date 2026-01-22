/**
 * Return Logistics Calculation Utilities
 * Story 44.10-FE: Return Logistics Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Business Logic:
 * return_logistics = logistics_to_customer × (1 - buyback_rate / 100)
 *
 * Example:
 * - logistics_to_customer = 100₽
 * - buyback_rate = 90% (выкуп)
 * - return_rate = 10% (возврат = 100 - 90)
 * - return_logistics = 100 * 0.10 = 10₽
 */

// ============================================================================
// Types
// ============================================================================

/** Input parameters for return logistics calculation */
export interface ReturnLogisticsParams {
  logisticsToCustomer: number
  buybackRate: number
}

/** Result of return logistics calculation */
export interface ReturnLogisticsResult {
  logisticsToCustomer: number
  buybackRate: number
  returnRate: number
  returnLogisticsCost: number
}

/** Breakdown object for detailed display */
export interface ReturnLogisticsBreakdown {
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

/**
 * Clamps a value to a min-max range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Rounds a number to specified decimal places
 */
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

/**
 * Main calculation function for return logistics cost
 * return_logistics = logistics_to_customer × (1 - buyback_rate / 100)
 */
export function calculateReturnLogistics(
  params: ReturnLogisticsParams
): ReturnLogisticsResult {
  const { logisticsToCustomer, buybackRate } = params

  // Handle negative logistics cost
  if (logisticsToCustomer < 0) {
    return {
      logisticsToCustomer,
      buybackRate,
      returnRate: calculateReturnRate(buybackRate),
      returnLogisticsCost: 0,
    }
  }

  // Clamp buyback rate to valid range
  const clampedBuybackRate = clamp(buybackRate, 0, 100)
  const returnRate = calculateReturnRate(clampedBuybackRate)

  // Calculate return logistics cost
  const returnLogisticsCost = roundTo(
    logisticsToCustomer * (returnRate / 100),
    2
  )

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
 * Returns detailed breakdown object for tooltip/display
 */
export function getReturnLogisticsBreakdown(
  logisticsToCustomer: number,
  buybackRate: number
): ReturnLogisticsBreakdown {
  const result = calculateReturnLogistics({ logisticsToCustomer, buybackRate })

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
