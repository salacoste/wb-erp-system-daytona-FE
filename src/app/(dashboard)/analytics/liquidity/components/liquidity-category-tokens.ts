/**
 * Liquidity category → design-system color role map (Story 169.10)
 *
 * Single source for the route's category colors: the SAME chart-role assignment
 * as the stacked trend chart (LIQUIDITY_TREND_COLORS) and the distribution
 * cards — liquid → chart-1 … illiquid → chart-4 — so all surfaces stay
 * cross-surface consistent in both themes.
 *
 * lib (liquidity-category-config) owns classification/labels; it also ships
 * legacy light-only hex colors (config.color/bgColor) which this route
 * intentionally does NOT consume — theme-aware var(--color-chart-N) roles
 * replace them.
 */

import type { LiquidityCategory } from '@/types/liquidity'

export const LIQUIDITY_CATEGORY_TOKENS: Record<string, string> = {
  highly_liquid: 'var(--color-chart-1)',
  medium: 'var(--color-chart-2)',
  low: 'var(--color-chart-3)',
  illiquid: 'var(--color-chart-4)',
} satisfies Record<LiquidityCategory, string>
