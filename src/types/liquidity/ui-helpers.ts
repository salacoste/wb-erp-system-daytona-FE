/**
 * Liquidity UI helper types — display configuration for charts and badges.
 * Split from distribution.ts for 200-line ESLint cap compliance.
 */

import type { LiquidityCategory } from './core'

// ============================================================================
// UI Helper Types
// ============================================================================

/** Liquidity category display configuration */
export interface LiquidityCategoryConfig {
  label: string
  labelShort: string
  color: string
  bgColor: string
  bgClass: string
  textClass: string
  icon: string
  minDays: number
  maxDays: number
  targetShare: string
}

/** Action type display configuration */
export interface ActionTypeConfig {
  label: string
  buttonLabel: string
  color: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
}

/** Benchmark status display configuration */
export interface BenchmarkStatusConfig {
  label: string
  color: string
  textClass: string
  icon: string
}

/** Distribution chart data point */
export interface DistributionChartData {
  category: LiquidityCategory
  name: string
  value: number
  count: number
  stockValue: number
  color: string
}

/** Trend chart data point */
export interface TrendChartData {
  date: string
  dateLabel: string
  highly_liquid: number
  medium: number
  low: number
  illiquid: number
  frozen_capital: number
  avg_turnover: number
}
