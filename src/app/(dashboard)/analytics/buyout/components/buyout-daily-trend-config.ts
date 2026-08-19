/**
 * Buyout Daily Trend Chart Configuration
 *
 * Colors, series config, and formatting helpers for the buyout daily trend chart.
 */

// ============================================================================
// Chart Colors
// ============================================================================

// Epic 169.4: valence chart tokens (buyout = positive, returns = negative), not categorical.
// Legend (BuyoutTrendLegend) and tooltip markers read these values — single source of truth.
export const BUYOUT_TREND_COLORS = {
  buyoutRate: 'var(--color-chart-positive)',
  returnRate: 'var(--color-chart-negative)',
  ordersCount: 'var(--color-chart-1)',
} as const

export type BuyoutTrendMetricKey = keyof typeof BUYOUT_TREND_COLORS

// ============================================================================
// Labels (Russian)
// ============================================================================

export const BUYOUT_TREND_LABELS: Record<BuyoutTrendMetricKey, string> = {
  buyoutRate: 'Выкуп',
  returnRate: 'Возвраты',
  ordersCount: 'Заказы',
}

// ============================================================================
// Series Configuration
// ============================================================================

export interface BuyoutTrendSeries {
  key: BuyoutTrendMetricKey
  label: string
  color: string
  axis: 'left' | 'right'
}

export const BUYOUT_TREND_SERIES: BuyoutTrendSeries[] = [
  {
    key: 'buyoutRate',
    label: BUYOUT_TREND_LABELS.buyoutRate,
    color: BUYOUT_TREND_COLORS.buyoutRate,
    axis: 'left',
  },
  {
    key: 'returnRate',
    label: BUYOUT_TREND_LABELS.returnRate,
    color: BUYOUT_TREND_COLORS.returnRate,
    axis: 'left',
  },
  {
    key: 'ordersCount',
    label: BUYOUT_TREND_LABELS.ordersCount,
    color: BUYOUT_TREND_COLORS.ordersCount,
    axis: 'right',
  },
]

export const DEFAULT_BUYOUT_VISIBLE: BuyoutTrendMetricKey[] = [
  'buyoutRate',
  'returnRate',
  'ordersCount',
]

// ============================================================================
// Formatting Helpers
// ============================================================================

/** Format date as DD.MM for x-axis labels */
export function formatDailyDate(date: string): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

/** Format full Russian date for tooltip */
export function formatDailyTooltipDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Format compact count for Y-axis */
export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}
