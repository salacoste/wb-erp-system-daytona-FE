/**
 * Liquidity Analysis Utility Functions
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 *
 * Split into modules (Story 74.5):
 * - liquidity-category-config.ts: Category config + getLiquidity* helpers
 * - liquidity-action-benchmark.ts: Action types, benchmarks, trend insights
 * - liquidity-formatters.ts: Formatters + chart data transformations
 * - this file: Barrel re-exports + summary/scenario helpers
 */

import type { LiquiditySummary } from '@/types/liquidity'
import { formatPercentageInt } from '@/lib/utils'

// Barrel re-exports — preserve consumer API
export {
  LIQUIDITY_CATEGORY_CONFIG,
  getLiquidityCategoryConfig,
  getLiquidityStatusColor,
  getLiquidityStatusBgColor,
  getLiquidityStatusLabel,
  getLiquidityStatusLabelShort,
  getLiquidityStatusIcon,
  getLiquidityBadgeClasses,
  getLiquidityTargetShare,
  getLiquidityDaysRange,
} from './liquidity-category-config'

export {
  ACTION_TYPE_CONFIG,
  getActionTypeConfig,
  getLiquidityActionLabel,
  getLiquidityActionButtonLabel,
  getLiquidityActionVariant,
  BENCHMARK_STATUS_CONFIG,
  getBenchmarkStatusConfig,
  getBenchmarkStatusColor,
  getBenchmarkStatusLabel,
  getBenchmarkStatusTextClass,
  getBenchmarkStatusIcon,
  getTrendInsightColor,
  getTrendInsightIcon,
  getTrendInsightBgClass,
} from './liquidity-action-benchmark'

export {
  formatTurnoverDays,
  formatVelocity,
  formatFrozenCapitalWarning,
  formatCurrency,
  formatCompactNumber,
  transformDistributionForChart,
  transformTrendsForChart,
  formatDateShort,
} from './liquidity-formatters'

export { mapLiquiditySortToApi, sortLiquidityItems } from './liquidity-sort'
export type { LiquidityUiSortField } from './liquidity-sort'

// ============================================================================
// Summary Calculation Helpers
// ============================================================================

/** Get count of illiquid (dead stock) SKUs */
export function getIlliquidSkuCount(summary: LiquiditySummary): number {
  return summary.distribution.illiquid.count
}

/** Get count of SKUs needing attention (low + illiquid) */
export function getAttentionNeededCount(summary: LiquiditySummary): number {
  return summary.distribution.low.count + summary.distribution.illiquid.count
}

/** Check if frozen capital is within target (<5%) */
export function isFrozenCapitalHealthy(summary: LiquiditySummary): boolean {
  return summary.frozen_capital_pct < 5
}

/** Check if highly liquid share is meeting target (>50%) */
export function isHighlyLiquidHealthy(summary: LiquiditySummary): boolean {
  return summary.distribution.highly_liquid.pct > 50
}

/** Calculate potential revenue unlock from liquidating dead stock */
export function calculatePotentialUnlock(
  summary: LiquiditySummary,
  avgDiscountPct: number = 30
): number {
  const frozenValue = summary.frozen_capital
  const recoveryRate = (100 - avgDiscountPct) / 100
  return frozenValue * recoveryRate
}

// ============================================================================
// Liquidation Scenario Helpers
// ============================================================================

/** Get recommended scenario from liquidation options */
export function getRecommendedScenario(
  scenarios:
    { target_days: number; suggested_discount_pct: number; is_profitable: boolean | null }[] | null
): typeof scenarios extends null ? null : NonNullable<typeof scenarios>[number] | null {
  if (!scenarios || scenarios.length === 0) return null

  const profitable = scenarios.filter(s => s.is_profitable)
  if (profitable.length === 0) return null

  const balanced = profitable.find(s => s.target_days === 60)
  if (balanced) return balanced

  return profitable.reduce((a, b) => (a.suggested_discount_pct < b.suggested_discount_pct ? a : b))
}

/**
 * Format discount percentage for display (e.g., "-30 %").
 * suggested_discount_pct is a whole-percent discount (integer in the backend contract) → Int + NBSP;
 * the literal "-" prefix marks it as a discount (magnitude formatted positive).
 */
export function formatDiscount(pct: number): string {
  return `-${formatPercentageInt(pct)}`
}

/**
 * Scenario urgency tier — non-localized classification id.
 * C15 (2026-09-02): consumers key visual classes/maps on this tier instead of
 * localized label strings, so label changes can't silently drop a class.
 */
export type ScenarioUrgencyTier = 'aggressive' | 'balanced' | 'conservative'

/**
 * Single classification source (C15, 2026-09-02).
 * Same thresholds as the previous inline label returns: <=30 aggressive,
 * <=60 balanced, else conservative.
 */
export function getScenarioUrgencyTier(targetDays: number): ScenarioUrgencyTier {
  if (targetDays <= 30) return 'aggressive'
  if (targetDays <= 60) return 'balanced'
  return 'conservative'
}

/** C15 (2026-09-02): labels map tier→string; behavior identical to the previous inline returns. */
const SCENARIO_URGENCY_LABEL: Record<ScenarioUrgencyTier, string> = {
  aggressive: 'Агрессивный',
  balanced: 'Сбалансированный',
  conservative: 'Консервативный',
}

/** Get scenario urgency label based on target days */
export function getScenarioUrgencyLabel(targetDays: number): string {
  return SCENARIO_URGENCY_LABEL[getScenarioUrgencyTier(targetDays)]
}

/**
 * Get scenario urgency color (hex). Production-dead (UI renders status tokens;
 * non-use pinned by liquidity-presentation-source-contracts) — kept for API
 * compatibility. C15 pass-1 review: thresholds now derive from the tier (single
 * classification source); the hex values intentionally do NOT match the status
 * tokens — registered as follow-up debt, do not "fix" by swapping hexes silently.
 */
export function getScenarioUrgencyColor(targetDays: number): string {
  const tier = getScenarioUrgencyTier(targetDays)
  switch (tier) {
    case 'aggressive':
      return '#EF4444'
    case 'balanced':
      return '#EAB308'
    case 'conservative':
      return '#22C55E'
    default: {
      // C15 pass-2 review: compile-time exhaustiveness over the tier union —
      // a future 4th tier fails HERE instead of silently falling into green.
      const exhausted: never = tier
      return exhausted
    }
  }
}
