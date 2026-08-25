/**
 * Daily Trend Chart Configuration
 * Story 72.3-FE: Advertising Daily Trend Charts
 *
 * Colors, labels, series config, and formatting helpers for the daily trend chart.
 */

// ============================================================================
// Chart Colors
// ============================================================================

// Story 170.1: chart tokens instead of hardcoded hex (169.4/169.11 canon).
// Valence: spend is a cost (higher = worse) → chart-negative; roas is an
// efficiency ratio (higher = better) → chart-positive. Categorical volume
// metrics (views/clicks/orders) → chart-1..3 in series order. Legend swatches,
// tooltip markers, and <Line> all read these values — single source of truth.
export const DAILY_TREND_COLORS = {
  spend: 'var(--color-chart-negative)',
  views: 'var(--color-chart-1)',
  clicks: 'var(--color-chart-2)',
  orders: 'var(--color-chart-3)',
  roas: 'var(--color-chart-positive)',
} as const

export type DailyTrendMetricKey = keyof typeof DAILY_TREND_COLORS

// ============================================================================
// Labels (Russian)
// ============================================================================

export const DAILY_TREND_LABELS: Record<DailyTrendMetricKey, string> = {
  spend: 'Расходы',
  views: 'Показы',
  clicks: 'Клики',
  orders: 'Заказы',
  roas: 'ROAS',
}

// ============================================================================
// Series Configuration
// ============================================================================

export interface DailyTrendSeries {
  key: DailyTrendMetricKey
  label: string
  color: string
  axis: 'left' | 'right'
}

export const DAILY_TREND_SERIES: DailyTrendSeries[] = [
  { key: 'spend', label: DAILY_TREND_LABELS.spend, color: DAILY_TREND_COLORS.spend, axis: 'left' },
  { key: 'views', label: DAILY_TREND_LABELS.views, color: DAILY_TREND_COLORS.views, axis: 'right' },
  {
    key: 'clicks',
    label: DAILY_TREND_LABELS.clicks,
    color: DAILY_TREND_COLORS.clicks,
    axis: 'right',
  },
  {
    key: 'orders',
    label: DAILY_TREND_LABELS.orders,
    color: DAILY_TREND_COLORS.orders,
    axis: 'right',
  },
  {
    key: 'roas',
    label: DAILY_TREND_LABELS.roas,
    color: DAILY_TREND_COLORS.roas,
    axis: 'right',
  },
]

export const DEFAULT_DAILY_VISIBLE: DailyTrendMetricKey[] = ['spend', 'views', 'clicks', 'orders']

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

/** Format full Russian date for tooltip: "Суббота, 8 марта 2026" */
export function formatDailyTooltipDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Re-export formatCompactCurrency as formatCompactRub for semantic clarity */
export { formatCompactCurrency as formatCompactRub } from '@/components/custom/dashboard/chart-config'

/** Format compact count for Y-axis */
export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}
