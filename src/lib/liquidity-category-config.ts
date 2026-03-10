/**
 * Liquidity Category Configuration & Helpers
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Extracted from liquidity-utils.ts (Story 74.5)
 */

import type { LiquidityCategory, LiquidityCategoryConfig } from '@/types/liquidity'

/**
 * Liquidity category configuration
 * Based on turnover days classification
 * Reference: docs/stories/7.0.liquidity-analysis-epic.md
 */
export const LIQUIDITY_CATEGORY_CONFIG: Record<LiquidityCategory, LiquidityCategoryConfig> = {
  highly_liquid: {
    label: 'Высоколиквидный',
    labelShort: 'Ликвид.',
    color: '#22C55E', // Green-500
    bgColor: '#DCFCE7', // Green-100
    bgClass: 'bg-green-500',
    textClass: 'text-white',
    icon: '🟢',
    minDays: 0,
    maxDays: 30,
    targetShare: '> 50%',
  },
  medium: {
    label: 'Средняя ликвидность',
    labelShort: 'Средний',
    color: '#EAB308', // Yellow-500
    bgColor: '#FEF9C3', // Yellow-100
    bgClass: 'bg-yellow-500',
    textClass: 'text-white',
    icon: '🟡',
    minDays: 31,
    maxDays: 60,
    targetShare: '30-40%',
  },
  low: {
    label: 'Низкая ликвидность',
    labelShort: 'Низкий',
    color: '#F97316', // Orange-500
    bgColor: '#FED7AA', // Orange-200
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
    icon: '🟠',
    minDays: 61,
    maxDays: 90,
    targetShare: '< 15%',
  },
  illiquid: {
    label: 'Неликвид',
    labelShort: 'Неликвид',
    color: '#EF4444', // Red-500
    bgColor: '#FEE2E2', // Red-100
    bgClass: 'bg-red-500',
    textClass: 'text-white',
    icon: '🔴',
    minDays: 91,
    maxDays: 999,
    targetShare: '< 5%',
  },
} as const

/** Get display configuration for liquidity category */
export function getLiquidityCategoryConfig(category: LiquidityCategory): LiquidityCategoryConfig {
  return LIQUIDITY_CATEGORY_CONFIG[category]
}

/** Get color for liquidity category (for charts) */
export function getLiquidityStatusColor(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).color
}

/** Get background color for liquidity category (for badges) */
export function getLiquidityStatusBgColor(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).bgColor
}

/** Get full label for liquidity category */
export function getLiquidityStatusLabel(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).label
}

/** Get short label for liquidity category (for table cells) */
export function getLiquidityStatusLabelShort(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).labelShort
}

/** Get icon emoji for liquidity category */
export function getLiquidityStatusIcon(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).icon
}

/** Get Tailwind classes for solid badge styling */
export function getLiquidityBadgeClasses(category: LiquidityCategory): string {
  const config = getLiquidityCategoryConfig(category)
  return `${config.bgClass} ${config.textClass}`
}

/** Get target share percentage for category */
export function getLiquidityTargetShare(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).targetShare
}

/** Get turnover days range for category */
export function getLiquidityDaysRange(category: LiquidityCategory): { min: number; max: number } {
  const config = getLiquidityCategoryConfig(category)
  return { min: config.minDays, max: config.maxDays }
}
