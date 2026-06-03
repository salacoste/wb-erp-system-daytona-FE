/**
 * Liquidity Formatting & Data Transformation Helpers
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Extracted from liquidity-utils.ts (Story 74.5)
 */

import type {
  LiquidityCategory,
  LiquidityDistribution,
  DistributionChartData,
  TrendDataPoint,
  TrendChartData,
} from '@/types/liquidity'
import { getLiquidityCategoryConfig } from './liquidity-category-config'

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format turnover days with Russian grammar
 * @param days - Number of days
 * @returns Formatted string (e.g., "22 дня", "145 дней")
 */
export function formatTurnoverDays(days: number): string {
  // 999 is the backend "never sells" sentinel — match it on the RAW value, BEFORE rounding,
  // so a real fractional slow-mover (e.g. 998.6) renders as its day count, not the sentinel.
  if (days >= 999) return 'Нет продаж'
  // Round to whole days: avg_turnover_days is a category/summary AVERAGE and can be fractional,
  // which previously leaked dot-decimals (e.g. "22.5 дня"). Integer inputs are unaffected.
  const d = Math.round(days)
  if (d === 0) return '< 1 дня'
  if (d === 1) return '1 день'
  if (d >= 2 && d <= 4) return `${d} дня`
  if (d >= 5 && d <= 20) return `${d} дней`

  const lastDigit = d % 10
  const lastTwoDigits = d % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${d} дней`
  }

  if (lastDigit === 1) return `${d} день`
  if (lastDigit >= 2 && lastDigit <= 4) return `${d} дня`
  return `${d} дней`
}

/**
 * Format velocity (units per day)
 * @param velocity - Daily sales velocity
 */
export function formatVelocity(velocity: number): string {
  if (velocity === 0) return '0 шт./день'
  if (velocity < 1) return `${velocity.toFixed(1)} шт./день`
  return `${Math.round(velocity)} шт./день`
}

/**
 * Format frozen capital with warning indicator
 * @param pct - Frozen capital percentage
 */
export function formatFrozenCapitalWarning(pct: number): string | null {
  if (pct > 10) return '🚨 Критически высокий уровень'
  if (pct > 5) return '⚠️ Выше нормы'
  return null
}

/** Get frozen capital status CSS class */
export function getFrozenCapitalStatusClass(pct: number): string {
  if (pct > 10) return 'text-red-600 font-bold'
  if (pct > 5) return 'text-orange-600 font-medium'
  return 'text-green-600'
}

/** Format currency value */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format compact number (e.g., "1.2M", "450K") */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`
  }
  return value.toString()
}

// ============================================================================
// Data Transformation Helpers
// ============================================================================

/**
 * Transform distribution data for pie chart
 * @param distribution - Liquidity distribution from API
 */
export function transformDistributionForChart(
  distribution: LiquidityDistribution
): DistributionChartData[] {
  const categories: LiquidityCategory[] = ['highly_liquid', 'medium', 'low', 'illiquid']

  return categories.map(category => {
    const item = distribution[category]
    const config = getLiquidityCategoryConfig(category)

    return {
      category,
      name: config.label,
      value: item.pct,
      count: item.count,
      stockValue: item.value,
      color: config.color,
    }
  })
}

/**
 * Transform trends data for chart
 * @param trends - Trend data points from API
 */
export function transformTrendsForChart(trends: TrendDataPoint[]): TrendChartData[] {
  return trends.map(point => ({
    date: point.date,
    dateLabel: formatDateShort(point.date),
    highly_liquid: point.distribution.highly_liquid_pct,
    medium: point.distribution.medium_pct,
    low: point.distribution.low_pct,
    illiquid: point.distribution.illiquid_pct,
    frozen_capital: point.frozen_capital,
    avg_turnover: point.avg_turnover_days,
  }))
}

/**
 * Format date for chart labels (short format)
 * @param dateStr - Date string (YYYY-MM-DD)
 * @returns Short date format (e.g., "12 дек")
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  const months = [
    'янв',
    'фев',
    'мар',
    'апр',
    'май',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ]
  return `${date.getDate()} ${months[date.getMonth()]}`
}
