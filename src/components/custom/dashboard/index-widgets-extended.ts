/**
 * Dashboard Widgets Sub-Barrel (Extended)
 * Extracted from index-widgets.ts for file-size compliance.
 *
 * Contains: Period Comparison, Historical Trends, Trends Chart Config,
 * and Inventory Summary Widget exports.
 */

// Period Comparison Section (Story 63.11-FE)
export { PeriodComparisonSection } from './PeriodComparisonSection'
export type { PeriodComparisonSectionProps } from './PeriodComparisonSection'

export { PeriodComparisonCard } from './PeriodComparisonCard'
export type { PeriodComparisonCardProps, DeltaValue } from './PeriodComparisonCard'

export { ComparisonModeToggle } from './ComparisonModeToggle'
export type { ComparisonModeToggleProps, ComparisonMode } from './ComparisonModeToggle'

export { DeltaIndicator } from './DeltaIndicator'
export type { DeltaIndicatorProps } from './DeltaIndicator'

export { PeriodComparisonSkeleton } from './PeriodComparisonSkeleton'
export type { PeriodComparisonSkeletonProps } from './PeriodComparisonSkeleton'

// Historical Trends Section (Story 63.12-FE)
export { HistoricalTrendsSection } from './HistoricalTrendsSection'
export type { HistoricalTrendsSectionProps } from './HistoricalTrendsSection'

export { TrendsChart } from './TrendsChart'
export type { TrendsChartProps } from './TrendsChart'

export { TrendsLegend } from './TrendsLegend'
export type { TrendsLegendProps } from './TrendsLegend'

export { TrendsPeriodSelector } from './TrendsPeriodSelector'
export type { TrendsPeriodSelectorProps, TrendsPeriod } from './TrendsPeriodSelector'

export { TrendsSummaryCard } from './TrendsSummaryCard'
export type { TrendsSummaryCardProps } from './TrendsSummaryCard'

export { TrendsSummaryGrid } from './TrendsSummaryGrid'
export type { TrendsSummaryGridProps } from './TrendsSummaryGrid'

export { TrendsChartSkeleton } from './TrendsChartSkeleton'
export type { TrendsChartSkeletonProps } from './TrendsChartSkeleton'

// Trends Chart Configuration (Story 63.12-FE)
export {
  TRENDS_METRICS,
  TRENDS_METRIC_MAP,
  DEFAULT_VISIBLE_TRENDS_METRICS,
  TRENDS_CHART_DIMENSIONS,
  TRENDS_STORAGE_KEYS,
  formatWeekLabel,
  formatCompactValue,
} from './trends-config'
export type { TrendsMetricKey, TrendsMetricConfig } from './trends-config'

// Inventory Summary Widget
export { InventorySummaryWidget } from './InventorySummaryWidget'
