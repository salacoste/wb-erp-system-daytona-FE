/**
 * Liquidity Distribution — UI helper types
 * Split from liquidity-distribution.ts for 200-line ESLint cap compliance.
 *
 * Contains display configuration types for charts and UI.
 */

import type { LiquidityCategory } from './liquidity-core'

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
