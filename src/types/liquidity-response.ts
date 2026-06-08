/**
 * Liquidity Analysis Types — Summary, Meta, and Response interfaces
 * Split from liquidity.ts for 200-line ESLint cap compliance.
 */

import type { LiquidityDistribution, LiquidityBenchmarks } from './liquidity-distribution'
import type { LiquidityItem } from './liquidity-core'

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
