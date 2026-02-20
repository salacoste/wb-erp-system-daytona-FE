/**
 * Chart Configuration Constants
 * Story 62.6-FE: Daily Breakdown Chart Component
 *
 * Defines colors, labels, and configuration for the daily breakdown chart.
 *
 * @see docs/stories/epic-62/story-62.6-fe-daily-breakdown-chart.md
 */

// ============================================================================
// Chart Colors (from wireframe)
// ============================================================================

export const CHART_COLORS = {
  orders: '#3B82F6', // Blue
  ordersCogs: '#F97316', // Orange
  sales: '#22C55E', // Green
  salesCogs: '#FB923C', // Light Orange
  advertising: '#7C3AED', // Purple
  logistics: '#06B6D4', // Cyan
  storage: '#EC4899', // Pink
  profit: '#E53935', // Primary Red
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
