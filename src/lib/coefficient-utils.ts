/**
 * Coefficient Utilities - Stories 44.9-FE, 44.26a-FE
 * WB coefficients: integers (100=1.0), normalized for display
 * Reference: docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md
 */

import { formatCurrency, formatPercentage } from '@/lib/utils'
import type {
  RawCoefficient,
  NormalizedCoefficient,
  CoefficientStatus,
  CoefficientStatusConfig,
  CoefficientImpact,
} from './coefficient-types'
import { COEFFICIENT_STATUS_CONFIG } from './coefficient-types'

// Re-export types and config for backward compatibility
export type {
  RawCoefficient,
  NormalizedCoefficient,
  CoefficientStatus,
  CoefficientStatusConfig,
  CoefficientImpact,
} from './coefficient-types'
export { COEFFICIENT_STATUS_CONFIG } from './coefficient-types'

// Re-export date helpers for backward compatibility
export {
  formatCoefficient,
  formatCoefficientDate,
  getDayFromDate,
  isToday,
  formatDateLongRu,
  getTomorrowDate,
  getFirstAvailableDate,
} from './coefficient-date-helpers'

/** Normalize coefficient from API: 100 → 1.0 */
export function normalizeCoefficient(raw: number): number {
  return raw / 100
}

/** Denormalize coefficient for API: 1.0 → 100 */
export function denormalizeCoefficient(normalized: number): number {
  return Math.round(normalized * 100)
}

/** Get coefficient status based on normalized value (5 levels) */
export function getCoefficientStatus(coefficient: number): CoefficientStatus {
  // coefficient < 0 (e.g. -1) = unavailable
  // coefficient = 0 = FREE (no markup), treated as 'base'
  if (coefficient < 0) return 'unavailable'
  if (coefficient <= 1.0) return 'base'
  if (coefficient <= 1.5) return 'elevated'
  if (coefficient <= 2.0) return 'high'
  return 'peak'
}

/** Get coefficient status configuration */
export function getCoefficientStatusConfig(coefficient: number): CoefficientStatusConfig {
  const status = getCoefficientStatus(coefficient)
  return COEFFICIENT_STATUS_CONFIG[status]
}

/** Normalize array of coefficients from API response */
export function normalizeCoefficients(raw: RawCoefficient[]): NormalizedCoefficient[] {
  return raw.map(item => {
    const normalized = normalizeCoefficient(item.coefficient)
    // isAvailable defaults to coefficient >= 0 if not provided
    const isAvailable = item.isAvailable ?? item.coefficient >= 0
    return {
      date: item.date,
      coefficient: normalized,
      status: getCoefficientStatus(normalized),
      isAvailable,
    }
  })
}

/** Calculate cost increase from coefficient */
export function calculateCoefficientImpact(
  baseCost: number,
  coefficient: number
): CoefficientImpact {
  if (coefficient <= 1.0 || baseCost <= 0) {
    return {
      increase: 0,
      percentIncrease: 0,
      increaseDisplay: '0 ₽',
      percentDisplay: formatPercentage(0, 1), // "0,0 %" (ru-RU), consistent with the +N,N % branch
    }
  }

  const adjustedCost = baseCost * coefficient
  const increase = adjustedCost - baseCost
  const percentIncrease = (coefficient - 1) * 100

  return {
    increase: Math.round(increase * 100) / 100,
    percentIncrease: Math.round(percentIncrease * 10) / 10,
    increaseDisplay: `+${formatCurrency(increase)}`,
    // percentIncrease > 0 here (guard returns early for coefficient <= 1), so '+' never doubles.
    percentDisplay: `+${formatPercentage(percentIncrease, 1)}`,
  }
}
