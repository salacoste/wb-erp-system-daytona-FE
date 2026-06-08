/**
 * Liquidity Distribution & Trends — API response types
 * Split from original distribution.ts for 200-line ESLint cap compliance.
 */

import type { BenchmarkStatus, TrendInsightType } from './core'

// ============================================================================
// Distribution Types
// ============================================================================

/** Distribution item for one liquidity category */
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

/** Distribution breakdown by liquidity category */
export interface LiquidityDistribution {
  highly_liquid: LiquidityDistributionItem
  medium: LiquidityDistributionItem
  low: LiquidityDistributionItem
  illiquid: LiquidityDistributionItem
}

/** Benchmark comparison data */
export interface LiquidityBenchmarks {
  your_avg_turnover: number
  target_avg_turnover: number
  industry_avg_turnover: number
  highly_liquid_pct: number
  target_highly_liquid_pct: number
  illiquid_pct: number
  target_illiquid_pct: number
  overall_status: BenchmarkStatus
}

// ============================================================================
// Trends Response Types
// ============================================================================

/** Distribution percentages for a trend point */
export interface TrendDistribution {
  highly_liquid_pct: number
  medium_pct: number
  low_pct: number
  illiquid_pct: number
}

/** Single trend data point */
export interface TrendDataPoint {
  date: string
  distribution: TrendDistribution
  frozen_capital: number
  avg_turnover_days: number
}

/** Trend insight message */
export interface TrendInsight {
  type: TrendInsightType
  message: string
}

/** Trends response metadata */
export interface LiquidityTrendsMeta {
  cabinet_id: string
  period_days: number
  generated_at: string
}

/** Full API response from GET /v1/analytics/liquidity/trends */
export interface LiquidityTrendsResponse {
  meta: LiquidityTrendsMeta
  trends: TrendDataPoint[]
  insights: TrendInsight[]
}

// Re-export UI helper types for backward compatibility
export type {
  LiquidityCategoryConfig,
  ActionTypeConfig,
  BenchmarkStatusConfig,
  DistributionChartData,
  TrendChartData,
} from './ui-helpers'
