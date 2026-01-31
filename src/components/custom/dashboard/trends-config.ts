/**
 * Trends Chart Configuration
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * Defines colors, labels, and configuration for the historical trends chart.
 *
 * @see docs/stories/epic-63/story-63.12-fe-historical-trends-section.md
 */

// ============================================================================
// Metric Configuration
// ============================================================================

export type TrendsMetricKey =
  | 'wb_sales_gross'
  | 'payout_total'
  | 'margin_pct'
  | 'logistics_cost'
  | 'storage_cost'

export interface TrendsMetricConfig {
  key: TrendsMetricKey
  label: string
  color: string
  yAxisId: 'left' | 'right'
  format: 'currency' | 'percentage'
}

export const TRENDS_METRICS: TrendsMetricConfig[] = [
  {
    key: 'wb_sales_gross',
    label: 'Выручка',
    color: '#3B82F6',
    yAxisId: 'left',
    format: 'currency',
  },
  {
    key: 'payout_total',
    label: 'К перечислению',
    color: '#22C55E',
    yAxisId: 'left',
    format: 'currency',
  },
  { key: 'margin_pct', label: 'Маржа', color: '#F59E0B', yAxisId: 'right', format: 'percentage' },
  {
    key: 'logistics_cost',
    label: 'Логистика',
    color: '#EF4444',
    yAxisId: 'left',
    format: 'currency',
  },
  { key: 'storage_cost', label: 'Хранение', color: '#7C4DFF', yAxisId: 'left', format: 'currency' },
]

export const TRENDS_METRIC_MAP = TRENDS_METRICS.reduce(
  (acc, metric) => {
    acc[metric.key] = metric
    return acc
  },
  {} as Record<TrendsMetricKey, TrendsMetricConfig>
)

// ============================================================================
// Default Visibility
// ============================================================================

export const DEFAULT_VISIBLE_TRENDS_METRICS = new Set<TrendsMetricKey>([
  'wb_sales_gross',
  'payout_total',
])

// ============================================================================
// Chart Dimensions
// ============================================================================

export const TRENDS_CHART_DIMENSIONS = {
  height: 300,
  margin: { top: 20, right: 60, bottom: 20, left: 60 },
} as const

// ============================================================================
// localStorage Keys
// ============================================================================

export const TRENDS_STORAGE_KEYS = {
  expanded: 'trendsExpanded',
  period: 'trendsPeriod',
  metrics: 'trendsMetrics',
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format week label for X-axis: "2026-W05" -> "W05"
 */
export function formatWeekLabel(week: string): string {
  const parts = week.split('-')
  return parts.length > 1 ? parts[1] : week
}

/**
 * Format currency value with K/M abbreviations
 */
export function formatCompactValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`
  }
  return value.toFixed(0)
}
