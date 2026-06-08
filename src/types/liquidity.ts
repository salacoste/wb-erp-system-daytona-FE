/**
 * Liquidity Analysis Types — Core types
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Backend: Request #55 - Liquidity API Endpoint
 * Reference: docs/stories/7.1.liquidity-api-integration.md
 *
 * Distribution, trends, and UI helper types extracted to ./liquidity-distribution.ts
 * (200-line ESLint cap, batch 2).
 */

// ============================================================================
// Enums & Constants
// ============================================================================

/**
 * Liquidity classification based on turnover days
 * - highly_liquid: ≤30 days (fast movers)
 * - medium: 31-60 days (acceptable)
 * - low: 61-90 days (slow movers)
 * - illiquid: >90 days (dead stock)
 */
export type LiquidityCategory = 'highly_liquid' | 'medium' | 'low' | 'illiquid'

/**
 * Action type recommendation
 */
export type ActionType =
  | 'MAXIMIZE' // Scale up - invest more
  | 'MAINTAIN' // Keep current level
  | 'REDUCE' // Reduce stock
  | 'LIQUIDATE' // Discount and sell

/**
 * Benchmark comparison status
 */
export type BenchmarkStatus =
  | 'excellent' // Better than target
  | 'good' // Meeting target
  | 'warning' // Below target
  | 'critical' // Far below target

/**
 * Trend insight type
 */
export type TrendInsightType = 'improvement' | 'warning' | 'info'

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for GET /v1/analytics/liquidity
 */
export interface LiquidityQueryParams {
  /** Filter by liquidity category */
  category_filter?: LiquidityCategory | 'all'
  /**
   * Sort field — MUST match backend LiquiditySortByEnum (liquidity-query.dto.ts). Sending any
   * other value (e.g. the table's stock_value / velocity_per_day UI columns) 400s the request and
   * blanks the page. Use mapLiquiditySortToApi() to translate UI columns to these values.
   */
  sort_by?: 'frozen_capital' | 'turnover_days' | 'current_stock' | 'product_name'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
  /** Max results (1-500, default: 100) */
  limit?: number
}

/**
 * Query parameters for GET /v1/analytics/liquidity/trends
 */
export interface LiquidityTrendsQueryParams {
  /** Days of history (default: 90) */
  period?: number
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Liquidation scenario for illiquid SKU
 * Calculates ROI for different discount levels
 */
export interface LiquidationScenario {
  /** Target turnover days (mapped from backend daysToClear) */
  target_days: number
  /** Required daily velocity to achieve target (null when backend omits) */
  required_velocity: number | null
  /** Multiplier needed vs current velocity (null when backend omits) */
  velocity_multiplier: number | null
  /** Suggested discount percentage (mapped from backend discountPct fraction) */
  suggested_discount_pct: number
  /** New price after discount (null when backend omits) */
  new_price: number | null
  /** Expected revenue if all stock sells; backend recovery maps here (null when backend omits) */
  expected_revenue: number | null
  /** Expected profit after COGS (null when backend omits) */
  expected_profit: number | null
  /** Is this scenario profitable? (null when backend omits) */
  is_profitable: boolean | null
}

/**
 * Single SKU liquidity data
 */
export interface LiquidityItem {
  /** WB article ID */
  sku_id: string
  /** Product name */
  product_name: string
  /** Category name */
  category: string
  /** Brand name */
  brand: string

  /** Current stock quantity */
  current_stock_qty: number
  /** Average stock quantity over 30 days */
  avg_stock_qty_30d: number
  /**
   * Stock value in ₽ (current_stock × COGS) = backend `frozen_capital`. `null` when COGS is
   * unassigned (backend sends `frozen_capital: null`) — render "—", never a fabricated "0 ₽"
   * (anti-pattern #8).
   */
  stock_value: number | null

  /** Units sold in last 30 days */
  units_sold_30d: number
  /** Daily sales velocity */
  velocity_per_day: number

  /** Calculated turnover days */
  turnover_days: number
  /** Liquidity classification */
  liquidity_category: LiquidityCategory

  /** Current selling price */
  current_price: number
  /** Cost of goods sold per unit */
  cogs_per_unit: number

  /** AI-generated recommendation text */
  recommendation: string
  /** Recommended action type */
  action_type: ActionType

  /** Liquidation scenarios (only for illiquid SKUs) */
  liquidation_scenarios: LiquidationScenario[] | null
}

// ============================================================================
// Summary & Meta (use distribution/benchmarks from liquidity-distribution.ts)
// ============================================================================

import type { LiquidityDistribution, LiquidityBenchmarks } from './liquidity-distribution'

/**
 * Summary statistics
 */
export interface LiquiditySummary {
  /** Total inventory value in ₽ */
  total_inventory_value: number
  /** Total number of SKUs */
  total_sku_count: number
  /** Frozen capital (value of illiquid stock) in ₽ */
  frozen_capital: number
  /** Frozen capital as percentage of total */
  frozen_capital_pct: number
  /** Average turnover days across all SKUs */
  avg_turnover_days: number
  /** Distribution by liquidity category */
  distribution: LiquidityDistribution
  /** Benchmark comparison */
  benchmarks: LiquidityBenchmarks
}

/**
 * Response metadata
 */
export interface LiquidityMeta {
  /** Cabinet UUID */
  cabinet_id: string
  /** Analysis period in days (default: 30) */
  analysis_period_days: number
  /** When response was generated */
  generated_at: string
  /** Last stock data update timestamp */
  stock_data_updated_at: string
}

/**
 * Full API response from GET /v1/analytics/liquidity
 */
export interface LiquidityResponse {
  meta: LiquidityMeta
  summary: LiquiditySummary
  data: LiquidityItem[]
}

// Re-export distribution, trends, and UI helper types for backward compatibility
export type {
  LiquidityDistributionItem,
  LiquidityDistribution,
  LiquidityBenchmarks,
  TrendDistribution,
  TrendDataPoint,
  TrendInsight,
  LiquidityTrendsMeta,
  LiquidityTrendsResponse,
  LiquidityCategoryConfig,
  ActionTypeConfig,
  BenchmarkStatusConfig,
  DistributionChartData,
  TrendChartData,
} from './liquidity-distribution'
