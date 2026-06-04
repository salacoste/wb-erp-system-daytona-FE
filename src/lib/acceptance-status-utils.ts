/**
 * Acceptance Status Utility Functions
 * Story 44.43-FE: Acceptance Coefficient Status Badge
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Utility functions for acceptance coefficient status determination
 * and display configuration.
 */

import type { AcceptanceStatus, AcceptanceStatusInfo } from '@/types/acceptance'

// Re-export types for convenience
export type { AcceptanceStatus, AcceptanceStatusInfo }

// Re-export config, formatting, and helpers from extracted module
export {
  ACCEPTANCE_STATUS_CONFIG,
  formatCoefficient,
  calculatePercentageIncrease,
  isAcceptanceAvailable,
  isFreeAcceptance,
  isElevatedAcceptance,
} from './acceptance-status-config'

import { ACCEPTANCE_STATUS_CONFIG, calculatePercentageIncrease } from './acceptance-status-config'
import { formatPercentageInt } from '@/lib/utils'

// ============================================================================
// Status Determination Functions
// ============================================================================

/**
 * Determine acceptance status from coefficient value
 *
 * @param coefficient - Acceptance coefficient from SUPPLY API
 * @returns AcceptanceStatus classification
 *
 * @example
 * getAcceptanceStatus(-1) // 'unavailable'
 * getAcceptanceStatus(0)  // 'free'
 * getAcceptanceStatus(1)  // 'standard'
 * getAcceptanceStatus(1.25) // 'elevated'
 * getAcceptanceStatus(1.65) // 'high'
 */
export function getAcceptanceStatus(coefficient: number): AcceptanceStatus {
  // Handle invalid values (undefined, null, NaN)
  if (coefficient === undefined || coefficient === null || Number.isNaN(coefficient)) {
    return 'unavailable'
  }

  // Handle negative values (including -1 for unavailable)
  if (coefficient < 0) {
    return 'unavailable'
  }

  // Free acceptance
  if (coefficient === 0) {
    return 'free'
  }

  // Standard cost
  if (coefficient === 1) {
    return 'standard'
  }

  // Elevated cost (1.01 - 1.50)
  if (coefficient > 1 && coefficient <= 1.5) {
    return 'elevated'
  }

  // High cost (> 1.50)
  return 'high'
}

/**
 * Get complete status information for display
 * Includes dynamic label for elevated/high coefficients
 *
 * @param coefficient - Acceptance coefficient from SUPPLY API
 * @returns Complete AcceptanceStatusInfo for badge display
 */
export function getAcceptanceStatusInfo(coefficient: number): AcceptanceStatusInfo {
  const status = getAcceptanceStatus(coefficient)
  const config = ACCEPTANCE_STATUS_CONFIG[status]
  const percentageIncrease = calculatePercentageIncrease(coefficient)

  // Build dynamic label for elevated/high status
  let label = config.label
  let description = config.description

  if (status === 'elevated' || status === 'high') {
    // Format as "x1.65" for elevated/high statuses
    label = `×${coefficient.toFixed(2)}`
    // Include percentage in description
    if (percentageIncrease !== null) {
      // percentageIncrease = Math.round((coef-1)*100) → integer percent-units → formatPercentageInt (NBSP), no *100
      description =
        status === 'elevated'
          ? `Стоимость приёмки увеличена на ${formatPercentageInt(percentageIncrease)}`
          : `Высокая стоимость приёмки (+${formatPercentageInt(percentageIncrease)})`
    }
  }

  return {
    status,
    coefficient,
    label,
    description,
    color: config.color,
    icon: config.icon,
    percentageIncrease,
  }
}
