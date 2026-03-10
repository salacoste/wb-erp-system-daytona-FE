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
  if (days >= 999) return 'Нет продаж'
  if (days === 0) return '< 1 дня'
  if (days === 1) return '1 день'
  if (days >= 2 && days <= 4) return `${days} дня`
  if (days >= 5 && days <= 20) return `${days} дней`

  const lastDigit = days % 10
  const lastTwoDigits = days % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${days} дней`
  }

  if (lastDigit === 1) return `${days} день`
  if (lastDigit >= 2 && lastDigit <= 4) return `${days} дня`
  return `${days} дней`
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

/** Format percentage for display */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
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
