/**
 * Returns Daily Trend Chart Configuration
 *
 * Colors, labels, series config, and formatting helpers for the
 * returns daily trend stacked-bar + rate-line chart.
 */

// ============================================================================
// Chart Colors
// ============================================================================

// Story 169.11: categorical bar stack → chart-1..3 tokens in stack order
// cancel→refusal→defect; returnRate line is valence (higher = worse) →
// var(--color-chart-negative) (169.4 BuyoutTrend precedent). Single source of
// truth: legend, tooltip markers, and <Bar>/<Line> all read these values.
export const RETURNS_DAILY_COLORS = {
  cancellations: 'var(--color-chart-1)',
  refusals: 'var(--color-chart-2)',
  defects: 'var(--color-chart-3)',
  returnRate: 'var(--color-chart-negative)',
} as const

export type ReturnsBarKey = 'cancellations' | 'refusals' | 'defects'

// ============================================================================
// Labels (Russian)
// ============================================================================

export const RETURNS_DAILY_LABELS: Record<string, string> = {
  cancellations: 'Отмены',
  refusals: 'Отказы',
  defects: 'Брак',
  returnRate: 'Доля возвратов',
  totalReturns: 'Итого возвратов',
}

// ============================================================================
// Stacked Bar Series (left Y-axis, counts)
// ============================================================================

export interface ReturnsBarSeries {
  key: ReturnsBarKey
  label: string
  color: string
}

export const RETURNS_BAR_SERIES: ReturnsBarSeries[] = [
  {
    key: 'cancellations',
    label: RETURNS_DAILY_LABELS.cancellations,
    color: RETURNS_DAILY_COLORS.cancellations,
  },
  { key: 'refusals', label: RETURNS_DAILY_LABELS.refusals, color: RETURNS_DAILY_COLORS.refusals },
  { key: 'defects', label: RETURNS_DAILY_LABELS.defects, color: RETURNS_DAILY_COLORS.defects },
]

// ============================================================================
// Formatting Helpers
// ============================================================================

/** Format date as DD.MM for x-axis labels */
export function formatReturnDate(date: string): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

/** Format compact count for Y-axis */
export function formatReturnCount(value: number): string {
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}
