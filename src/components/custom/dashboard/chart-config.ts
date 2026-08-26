/**
 * Chart Configuration Constants
 * Story 62.6-FE: Daily Breakdown Chart Component
 *
 * Defines colors, labels, and configuration for the daily breakdown chart.
 *
 * @see docs/stories/epic-62/story-62.6-fe-daily-breakdown-chart.md
 */

// ============================================================================
// Chart Colors (Story 172.1: registered chart tokens, hue-faithful)
// ============================================================================
// Categorical series map onto chart-1..6 by legacy hue (channel-styling 170.1
// precedent). The two COGS series shared the orange tone family in the legacy
// palette and therefore share chart-5. "Теор. прибыль" is a SIGNED series that
// renders beside the sales line by default → primary (legacy brand-red hue);
// chart-positive would collide with chart-4 (identical token value in the
// light theme) — review pass 1 finding. Latent registry identity to remember:
// chart-negative equals primary in the light theme (harmless today — they
// never share a canvas; review pass 2 note).

export const CHART_COLORS = {
  orders: 'var(--color-chart-1)',
  ordersCogs: 'var(--color-chart-5)',
  sales: 'var(--color-chart-4)',
  salesCogs: 'var(--color-chart-5)',
  advertising: 'var(--color-chart-2)',
  logistics: 'var(--color-chart-3)',
  storage: 'var(--color-chart-6)',
  profit: 'var(--color-primary)',
} as const

// ============================================================================
// Metric Labels (Russian)
// ============================================================================

export const METRIC_LABELS: Record<keyof typeof CHART_COLORS, string> = {
  orders: 'Заказы',
  ordersCogs: 'COGS заказов',
  sales: 'Выкупы',
  salesCogs: 'COGS выкупов',
  advertising: 'Реклама',
  logistics: 'Логистика',
  storage: 'Хранение',
  profit: 'Теор. прибыль',
}

// ============================================================================
// Y-Axis Configuration
// ============================================================================

export const METRIC_AXIS: Record<keyof typeof CHART_COLORS, 'left' | 'right'> = {
  orders: 'left',
  ordersCogs: 'left',
  sales: 'left',
  salesCogs: 'left',
  advertising: 'right',
  logistics: 'right',
  storage: 'right',
  profit: 'left',
}

// ============================================================================
// Metric Series Configuration
// ============================================================================

export interface MetricSeries {
  key: keyof typeof CHART_COLORS
  label: string
  color: string
  axis: 'left' | 'right'
}

export const METRIC_SERIES: MetricSeries[] = [
  { key: 'orders', label: METRIC_LABELS.orders, color: CHART_COLORS.orders, axis: 'left' },
  {
    key: 'ordersCogs',
    label: METRIC_LABELS.ordersCogs,
    color: CHART_COLORS.ordersCogs,
    axis: 'left',
  },
  { key: 'sales', label: METRIC_LABELS.sales, color: CHART_COLORS.sales, axis: 'left' },
  { key: 'salesCogs', label: METRIC_LABELS.salesCogs, color: CHART_COLORS.salesCogs, axis: 'left' },
  {
    key: 'advertising',
    label: METRIC_LABELS.advertising,
    color: CHART_COLORS.advertising,
    axis: 'right',
  },
  {
    key: 'logistics',
    label: METRIC_LABELS.logistics,
    color: CHART_COLORS.logistics,
    axis: 'right',
  },
  { key: 'storage', label: METRIC_LABELS.storage, color: CHART_COLORS.storage, axis: 'right' },
  { key: 'profit', label: METRIC_LABELS.profit, color: CHART_COLORS.profit, axis: 'left' },
]

// ============================================================================
// Default Visibility (which series are visible by default)
// ============================================================================

export const DEFAULT_VISIBLE_SERIES = ['orders', 'sales', 'advertising', 'profit']

export const STORAGE_KEY = 'dashboard-chart-legend'

// ============================================================================
// Chart Dimensions
// ============================================================================

export const CHART_DIMENSIONS = {
  desktop: { height: 320, margins: { top: 20, right: 30, bottom: 60, left: 60 } },
  tablet: { height: 280, margins: { top: 16, right: 20, bottom: 50, left: 50 } },
  mobile: { height: 240, margins: { top: 12, right: 10, bottom: 40, left: 40 } },
} as const

// ============================================================================
// Day Labels (Russian)
// ============================================================================

export const DAY_LABELS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format day label based on period type
 * Week mode: "Пн", "Вт", etc.
 * Month mode: "1", "2", ..., "31"
 */
export function formatDayLabel(date: string, periodType: 'week' | 'month'): string {
  const d = new Date(date)
  if (periodType === 'week') {
    return DAY_LABELS_RU[d.getDay()]
  }
  return d.getDate().toString()
}

/**
 * Format currency as compact (e.g., 1.2M, 450K)
 */
export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`
  }
  return value.toFixed(0)
}

/**
 * Format full date for tooltip (Russian locale)
 * Returns "Среда, 29 января 2026"
 */
export function formatTooltipDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ============================================================================
// Type Exports
// ============================================================================

export type MetricKey = keyof typeof CHART_COLORS
