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
    color: 'var(--color-valence-1)', // C5-W2: valence good (light pixel-identical to legacy Green-500)
    bgColor: 'color-mix(in srgb, var(--color-valence-1) 14%, var(--color-card))', // theme-aware tint
    bgClass: 'bg-valence-1', // C5-W2 token utility (light ≡ legacy green-500)
    textClass: 'text-white',
    icon: '🟢',
    minDays: 0,
    maxDays: 30,
    targetShare: '> 50%',
  },
  medium: {
    label: 'Средняя ликвидность',
    labelShort: 'Средний',
    color: 'var(--color-valence-3)', // C5-W2 (light ≡ legacy Yellow-500)
    bgColor: 'color-mix(in srgb, var(--color-valence-3) 18%, var(--color-card))', // theme-aware tint
    bgClass: 'bg-valence-3',
    textClass: 'text-white',
    icon: '🟡',
    minDays: 31,
    maxDays: 60,
    targetShare: '30-40%',
  },
  low: {
    label: 'Низкая ликвидность',
    labelShort: 'Низкий',
    color: 'var(--color-valence-4)', // C5-W2 (light ≡ legacy Orange-500)
    bgColor: 'color-mix(in srgb, var(--color-valence-4) 28%, var(--color-card))', // theme-aware tint
    bgClass: 'bg-valence-4',
    textClass: 'text-white',
    icon: '🟠',
    minDays: 61,
    maxDays: 90,
    targetShare: '< 15%',
  },
  illiquid: {
    label: 'Неликвид',
    labelShort: 'Неликвид',
    color: 'var(--color-valence-5)', // C5-W2 (light ≡ legacy Red-500)
    bgColor: 'color-mix(in srgb, var(--color-valence-5) 14%, var(--color-card))', // theme-aware tint
    bgClass: 'bg-valence-5',
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
