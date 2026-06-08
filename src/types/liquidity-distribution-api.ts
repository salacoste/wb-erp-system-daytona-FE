/**
 * Liquidity Distribution & Trends — API response types
 * Split from liquidity-distribution.ts for 200-line ESLint cap compliance.
 */

import type { BenchmarkStatus, TrendInsightType } from './liquidity-core'

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
