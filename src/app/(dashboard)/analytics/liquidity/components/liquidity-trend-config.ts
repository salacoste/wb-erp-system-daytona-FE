/**
 * Liquidity Trend Chart Configuration
 * Story 165.4-FE: Liquidity Trends (Динамика ликвидности)
 *
 * Colors, labels, and formatting helpers for the trend chart series.
 * Series map directly onto the BE TrendDataPoint contract
 * (GET /v1/analytics/liquidity/trends) — see src/types/liquidity/distribution.ts.
 */

// ============================================================================
// Series Keys
// ============================================================================

/** Numeric series drawn on the dual-axis ComposedChart. */
export type LiquidityTrendMetricKey = 'frozen_capital' | 'avg_turnover_days'

/** Distribution percentage keys drawn on the stacked AreaChart. */
export type LiquidityTrendDistributionKey =
  'highly_liquid_pct' | 'medium_pct' | 'low_pct' | 'illiquid_pct'

// ============================================================================
// Colors (align with dashboard semantic palette)
// ============================================================================

export const LIQUIDITY_TREND_COLORS = {
  frozen_capital: '#7C3AED', // Purple — frozen capital (₽, left axis)
  avg_turnover_days: '#E53935', // Primary red — turnover days (right axis)
  highly_liquid_pct: '#22C55E', // Green
  medium_pct: '#3B82F6', // Blue
  low_pct: '#F59E0B', // Amber
  illiquid_pct: '#9CA3AF', // Gray
} as const

// ============================================================================
// Labels (Russian)
// ============================================================================

export const LIQUIDITY_TREND_LABELS: Record<LiquidityTrendMetricKey, string> = {
  frozen_capital: 'Замороженный капитал',
  avg_turnover_days: 'Средний оборот, дней',
}

export const LIQUIDITY_DISTRIBUTION_LABELS: Record<LiquidityTrendDistributionKey, string> = {
  highly_liquid_pct: 'Высоколиквидные',
  medium_pct: 'Средняя ликвидность',
  low_pct: 'Низкая ликвидность',
  illiquid_pct: 'Неликвид',
}

/** Distribution keys in stable stack order (liquid → illiquid). */
export const DISTRIBUTION_STACK_ORDER: LiquidityTrendDistributionKey[] = [
  'highly_liquid_pct',
  'medium_pct',
  'low_pct',
  'illiquid_pct',
]

/** Available period presets (days). Default = 90 (matches BE). */
export const PERIOD_PRESETS = [30, 60, 90] as const
export type LiquidityTrendPeriod = (typeof PERIOD_PRESETS)[number]
export const DEFAULT_PERIOD: LiquidityTrendPeriod = 90

// ============================================================================
// Formatting Helpers (axis ticks — exempt from dot-locale ratchet)
// ============================================================================

/** Format date as DD.MM for x-axis labels. */
// locale-percent-allow: recharts axis tick (not a rendered percentage)
export function formatTrendDate(date: string): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

/** Compact ₽ for the left Y-axis (e.g. "50K", "1,2M"). */
// recharts axis tick — compact currency (not a percentage, no locale-percent ratchet)
export function formatTrendAxisRub(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toFixed(0)
}

/** Whole-day tick for the right Y-axis. */
// recharts axis tick — integer days (not a percentage, no locale-percent ratchet)
export function formatTrendAxisDays(value: number): string {
  return Math.round(value).toString()
}

/** Full RU date for tooltip header: "8 августа 2026". */
export function formatTrendTooltipDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
