/**
 * Polling configuration helpers for margin recalculation
 * Extracted from margin-helpers.ts for file size compliance (Epic 74)
 *
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 */

import { calculateAffectedWeeks } from './margin-helpers'

/**
 * Polling configuration for different scenarios
 */
export interface PollingConfig {
  /** Polling interval in milliseconds */
  interval: number
  /** Maximum polling attempts */
  maxAttempts: number
  /** Estimated calculation time in milliseconds */
  estimatedTime: number
}

/**
 * Estimate calculation time based on number of affected weeks
 * Formula: weeks.length * 5 seconds (5 seconds per week)
 * Minimum: 5 seconds, Maximum: 60 seconds
 *
 * @param weeks - Array of ISO week strings
 * @returns Estimated time in milliseconds
 *
 * @example
 * estimateCalculationTime(["2025-W41", "2025-W42", "2025-W43"])
 * // Returns: 15000 (15 seconds)
 */
export function estimateCalculationTime(weeks: string[]): number {
  if (weeks.length === 0) {
    return 5000 // Minimum 5 seconds
  }

  const secondsPerWeek = 5
  const totalSeconds = weeks.length * secondsPerWeek

  // Clamp between 5 and 60 seconds
  const clampedSeconds = Math.max(5, Math.min(60, totalSeconds))

  return clampedSeconds * 1000 // Convert to milliseconds
}

/**
 * Get polling strategy based on valid_from date and operation type
 * Determines appropriate interval, maxAttempts, and estimatedTime
 *
 * Strategies:
 * - Single product (current date): 3s interval, 10 attempts (30s max)
 * - Single product (historical date): 5s interval, 10 attempts (50s max)
 * - Bulk assignment: 5s interval, 20 attempts (100s max)
 *
 * @param validFrom - ISO date string (YYYY-MM-DD) or Date object
 * @param isBulk - Whether this is a bulk operation
 * @returns Polling configuration
 */
export function getPollingStrategy(validFrom: string | Date, isBulk: boolean): PollingConfig {
  // Bulk operations always use bulk strategy
  if (isBulk) {
    return {
      interval: 5000,
      maxAttempts: 20,
      estimatedTime: 60000,
    }
  }

  // Calculate affected weeks to determine if historical
  const weeks = calculateAffectedWeeks(validFrom)
  const estimatedTime = estimateCalculationTime(weeks)

  // Historical date: more than 1 week affected
  if (weeks.length > 1) {
    return {
      interval: 5000,
      maxAttempts: 10,
      estimatedTime,
    }
  }

  // Current date: single week
  return {
    interval: 3000,
    maxAttempts: 10,
    estimatedTime: 10000,
  }
}
