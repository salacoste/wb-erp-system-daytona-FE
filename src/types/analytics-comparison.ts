/**
 * Analytics Comparison Types
 * Story 61.5-FE: Comparison Endpoint Integration
 * Epic 61-FE: Dashboard Data Integration (API Layer)
 *
 * TypeScript interfaces for the comparison API endpoint.
 * GET /v1/analytics/weekly/comparison
 *
 * @see docs/stories/epic-61/story-61.5-fe-comparison-endpoint.md
 */

// ============================================================================
// Request Types
// ============================================================================

/**
 * Parameters for comparison API request
 */
export interface ComparisonParams {
  /** First period - single week (2026-W05) or range (2026-W01:W05) */
  period1: string
  /** Second period - single week (2026-W04) or range (2025-W49:W52) */
  period2: string
  /** Optional grouping for breakdown data */
  groupBy?: 'sku' | 'brand' | 'category'
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Metrics for a single period
 */
export interface PeriodMetrics {
  /** Period identifier (ISO week or range) */
  week: string
  /** Gross revenue (wb_sales_gross) */
  revenue: number
  /** Net profit after COGS */
  profit: number
  /** Margin percentage */
  margin_pct: number
  /** Number of orders */
  orders: number
  /** Cost of goods sold */
  cogs: number
  /** Logistics costs */
  logistics: number
  /** Storage costs */
  storage: number
  /** Advertising spend */
  advertising: number
}

/**
 * Delta value with absolute and percentage change
 */
export interface DeltaValue {
  /** Absolute difference (period1 - period2) */
  absolute: number
  /** Percentage change ((period1 - period2) / period2 * 100) */
  percent: number
}

/**
 * Delta values for all metrics
 */
export interface ComparisonDeltas {
  revenue: DeltaValue
  profit: DeltaValue
  margin_pct: DeltaValue
  orders: DeltaValue
  cogs: DeltaValue
  logistics: DeltaValue
  storage: DeltaValue
  advertising: DeltaValue
}

/**
 * Breakdown item for groupBy queries
 */
export interface BreakdownItem {
  /** Identifier (SKU nm_id, brand name, or category name) */
  id: string
  /** Display name */
  name: string
  /** Value in period 1 */
  period1_value: number
  /** Value in period 2 */
  period2_value: number
  /** Absolute difference */
  delta_absolute: number
  /** Percentage change */
  delta_percent: number
}

/**
 * Full comparison response from API
 */
export interface ComparisonResponse {
  /** Metrics for first period (current/target period) */
  period1: PeriodMetrics
  /** Metrics for second period (comparison/baseline period) */
  period2: PeriodMetrics
  /** Calculated deltas between periods */
  delta: ComparisonDeltas
  /** Optional breakdown by SKU/brand/category */
  breakdown?: BreakdownItem[]
}

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
