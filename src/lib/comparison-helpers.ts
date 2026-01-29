/**
 * Comparison Helper Functions for Story 60.3-FE
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Pure utility functions for calculating percentage changes, trends, and formatting.
 * Used by MetricCardEnhanced and comparison components.
 *
 * @see docs/stories/epic-60/story-60.3-fe-enhanced-metric-card.md
 */

import { formatCurrency } from '@/lib/utils'

/**
 * Trend direction for comparison indicators
 * - positive: value increased (or decreased for expenses with invertComparison)
 * - negative: value decreased (or increased for expenses with invertComparison)
 * - neutral: change below threshold or no change
 */
export type TrendDirection = 'positive' | 'negative' | 'neutral'

/**
 * Result of comparison calculation between two values
 */
export interface ComparisonResult {
  /** Raw percentage change (-100 to +Infinity) */
  percentageChange: number
  /** Formatted percentage string with sign ("+10,0%" or "-5,2%") */
  formattedPercentage: string
  /** Raw absolute difference */
  absoluteDifference: number
  /** Formatted absolute difference with sign and currency ("+1 000,00 ₽") */
  formattedDifference: string
  /** Semantic direction based on change and inversion setting */
  direction: TrendDirection
}

/** Changes below this threshold (0.1%) are considered neutral */
const NEUTRAL_THRESHOLD = 0.1

/**
 * Formats a percentage value for display in Russian locale
 * @param value - Percentage value (e.g., 10.5 for 10.5%)
 * @returns Formatted string with sign and Russian decimal separator
 */
function formatPercentageForComparison(value: number): string {
  const sign = value >= 0 ? '+' : ''
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  return `${sign}${value < 0 ? '-' : ''}${formatted}%`
}

/**
 * Calculate comparison between current and previous values
 *
 * Handles edge cases: zero/null previous values, negative numbers
 * Supports inverted comparison for expense metrics (lower is better)
 *
 * @param current - Current period value
 * @param previous - Previous period value
 * @param invertComparison - True for expenses where lower is better
 * @returns ComparisonResult or null if comparison cannot be calculated
 *
 * @example
 * // Standard comparison (higher is better)
 * calculateComparison(110, 100) // +10%, positive direction
 *
 * @example
 * // Inverted comparison (lower is better, e.g., expenses)
 * calculateComparison(90, 100, true) // -10%, positive direction (improvement)
 */
export function calculateComparison(
  current: number,
  previous: number | null | undefined,
  invertComparison = false
): ComparisonResult | null {
  // Cannot compare if no valid previous value
  if (previous === null || previous === undefined || previous === 0) {
    return null
  }

  // Calculate percentage change using absolute previous for denominator
  // This handles negative previous values correctly
  const percentageChange = ((current - previous) / Math.abs(previous)) * 100
  const absoluteDifference = current - previous

  // Determine semantic direction
  let direction: TrendDirection
  if (Math.abs(percentageChange) < NEUTRAL_THRESHOLD) {
    direction = 'neutral'
  } else if (percentageChange > 0) {
    // Increase: positive for revenue, negative for expenses
    direction = invertComparison ? 'negative' : 'positive'
  } else {
    // Decrease: negative for revenue, positive for expenses
    direction = invertComparison ? 'positive' : 'negative'
  }

  // Format percentage with sign
  const formattedPercentage = formatPercentageForComparison(percentageChange)

  // Format absolute difference with sign
  const diffSign = absoluteDifference >= 0 ? '+' : ''
  const formattedDifference = `${diffSign}${formatCurrency(absoluteDifference)}`

  return {
    percentageChange,
    formattedPercentage,
    absoluteDifference,
    formattedDifference,
    direction,
  }
}
