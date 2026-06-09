/**
 * Analytics Comparison UI Helper Types
 * Extracted from analytics-comparison.ts for file-size compliance
 * Story 61.5-FE: Comparison Endpoint Integration
 */

// ============================================================================
// UI Helper Types
// ============================================================================

/**
 * Direction indicator for UI components
 */
export type ChangeDirection = 'up' | 'down' | 'neutral'

/**
 * UI-friendly metric comparison for components
 */
export interface MetricComparison {
  /** Current period value */
  current: number
  /** Previous/comparison period value */
  previous: number
  /** Absolute change */
  change: number
  /** Percentage change */
  changePercent: number
  /** Direction for styling (up/down/neutral) */
  direction: ChangeDirection
}

/**
 * Dashboard metrics with comparison data
 */
export interface DashboardMetricsComparison {
  revenue: MetricComparison
  profit: MetricComparison
  margin: MetricComparison
  orders: MetricComparison
}

/**
 * Expense metrics with comparison data
 */
export interface ExpenseMetricsComparison {
  cogs: MetricComparison
  logistics: MetricComparison
  storage: MetricComparison
  advertising: MetricComparison
}

// ============================================================================
// Preset Types (used with Story 61.6)
// ============================================================================

/**
 * Comparison preset type
 */
export type ComparisonPresetType = 'mom' | 'qoq' | 'yoy' | 'custom'

/**
 * Preset periods in ISO week format
 */
export interface PresetPeriods {
  /** Current/target period */
  period1: string
  /** Comparison/baseline period */
  period2: string
}

/**
 * Preset with metadata for YoY W53 edge case
 */
export interface PresetPeriodsWithMeta extends PresetPeriods {
  /** True if W53 fallback was used for YoY comparison */
  weekMismatch?: boolean
}
