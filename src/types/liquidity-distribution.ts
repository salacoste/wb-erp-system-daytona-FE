/**
 * Liquidity Distribution & Chart Types
 * Extracted from liquidity.ts (200-line ESLint cap, batch 2)
 *
 * Contains: distribution interfaces, benchmark types, trends types, and UI helper types
 * for charts and display configuration.
 */

import type { LiquidityCategory, BenchmarkStatus, TrendInsightType } from './liquidity'

// ============================================================================
// Distribution Types
// ============================================================================

/**
 * Distribution item for one liquidity category
 */
export interface LiquidityDistributionItem {
  /** Number of SKUs in this category */
  count: number
  /** Total stock value in this category */
  value: number
  /** Percentage of total inventory value */
  pct: number
  /** Average turnover days in this category */
  avg_turnover_days: number
  /** Number of SKUs with zero sales (turnover_days >= 999 sentinel) */
  no_sales_count: number
}

/**
 * Distribution breakdown by liquidity category
 */
export interface LiquidityDistribution {
  highly_liquid: LiquidityDistributionItem
  medium: LiquidityDistributionItem
  low: LiquidityDistributionItem
  illiquid: LiquidityDistributionItem
}

/**
 * Benchmark comparison data
 */
export interface LiquidityBenchmarks {
  /** Your average turnover days */
  your_avg_turnover: number
  /** Target average turnover days */
  target_avg_turnover: number
  /** Industry average turnover days */
  industry_avg_turnover: number
  /** Your highly liquid percentage */
  highly_liquid_pct: number
  /** Target highly liquid percentage (>50%) */
  target_highly_liquid_pct: number
  /** Your illiquid percentage */
  illiquid_pct: number
  /** Target illiquid percentage (<5%) */
  target_illiquid_pct: number
  /** Overall benchmark status */
  overall_status: BenchmarkStatus
}

// ============================================================================
// Trends Response Types
// ============================================================================

/**
 * Distribution percentages for a trend point
 */
export interface TrendDistribution {
  highly_liquid_pct: number
  medium_pct: number
  low_pct: number
  illiquid_pct: number
}

/**
 * Single trend data point
 */
export interface TrendDataPoint {
  /** Date string (YYYY-MM-DD) */
  date: string
  /** Distribution percentages */
  distribution: TrendDistribution
  /** Frozen capital in ₽ */
  frozen_capital: number
  /** Average turnover days */
  avg_turnover_days: number
}

/**
 * Trend insight message
 */
export interface TrendInsight {
  /** Insight type */
  type: TrendInsightType
  /** Human-readable message */
  message: string
}

/**
 * Trends response metadata
 */
export interface LiquidityTrendsMeta {
  /** Cabinet UUID */
  cabinet_id: string
  /** Period in days */
  period_days: number
  /** When response was generated */
  generated_at: string
}

/**
 * Full API response from GET /v1/analytics/liquidity/trends
 */
export interface LiquidityTrendsResponse {
  meta: LiquidityTrendsMeta
  trends: TrendDataPoint[]
  insights: TrendInsight[]
}

// ============================================================================
// UI Helper Types
// ============================================================================

/**
 * Liquidity category display configuration
 */
export interface LiquidityCategoryConfig {
  /** Full Russian label */
  label: string
  /** Short label for badges */
  labelShort: string
  /** Primary color hex */
  color: string
  /** Background color for badges */
  bgColor: string
  /** Tailwind bg class */
  bgClass: string
  /** Tailwind text class */
  textClass: string
  /** Emoji icon */
  icon: string
  /** Min turnover days for this category */
  minDays: number
  /** Max turnover days for this category */
  maxDays: number
  /** Target share percentage */
  targetShare: string
}

/**
 * Action type display configuration
 */
export interface ActionTypeConfig {
  /** Full Russian label */
  label: string
  /** Button label */
  buttonLabel: string
  /** Primary color hex */
  color: string
  /** Tailwind variant */
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
}

/**
 * Benchmark status display configuration
 */
export interface BenchmarkStatusConfig {
  /** Russian label */
  label: string
  /** Primary color hex */
  color: string
  /** Tailwind text class */
  textClass: string
  /** Emoji icon */
  icon: string
}

/**
 * Distribution chart data point
 */
export interface DistributionChartData {
  /** Category key */
  category: LiquidityCategory
  /** Russian label */
  name: string
  /** Value (percentage) */
  value: number
  /** SKU count */
  count: number
  /** Stock value in ₽ */
  stockValue: number
  /** Color */
  color: string
}

/**
 * Trend chart data point
 */
export interface TrendChartData {
  /** Date string */
  date: string
  /** Formatted date for display */
  dateLabel: string
  /** Category percentages */
  highly_liquid: number
  medium: number
  low: number
  illiquid: number
  /** Frozen capital */
  frozen_capital: number
  /** Average turnover */
  avg_turnover: number
}
