/**
 * Return Logistics Legacy API and Display Helpers
 * Story 44.10-FE: Return Logistics Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Extracted from return-logistics-utils.ts for file size compliance.
 * Contains deprecated legacy interfaces and display helper functions.
 */

import { calculateReturnRate, calculateReturnLogisticsLegacy } from './return-logistics-utils'
import type { ReturnLogisticsParams, LegacyReturnLogisticsResult } from './return-logistics-utils'

// Re-export legacy types for backward compatibility
export type { ReturnLogisticsParams, LegacyReturnLogisticsResult }

// ============================================================================
// Legacy Types (Backward Compatibility)
// ============================================================================

/** @deprecated Use ReturnLogisticsBreakdown - Legacy breakdown interface */
export interface LegacyReturnLogisticsBreakdown {
  logisticsToCustomer: number
  buybackRate: number
  returnRate: number
  returnLogisticsCost: number
  formula: string
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

/** Threshold for high return rate warning (%) */
const HIGH_RETURN_RATE_THRESHOLD = 15

/** Low return rate threshold for green color (%) */
const LOW_RETURN_RATE_THRESHOLD = 5

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
