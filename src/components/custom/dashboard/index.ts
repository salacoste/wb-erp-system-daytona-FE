/**
 * Dashboard Components - Barrel Export
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * @see docs/epics/epic-62-fe-dashboard-presentation.md
 */

// Skeleton components
export { DashboardMetricsGridSkeleton } from './DashboardMetricsGridSkeleton'

// Daily Breakdown components (Story 62.8, 62.9)
export { DailyMetricsTable } from './DailyMetricsTable'
export type { DailyMetricsTableProps } from './DailyMetricsTable'

export { DailyMetricsTableHeader } from './DailyMetricsTableHeader'
export { DailyMetricsTableRow } from './DailyMetricsTableRow'

export { ViewToggle } from './ViewToggle'
export type { ViewToggleProps, ViewType } from './ViewToggle'

export { DailyBreakdownSection } from './DailyBreakdownSection'
export type { DailyBreakdownSectionProps } from './DailyBreakdownSection'

// Table utilities
export {
  COLUMNS,
  formatDayWithDate,
  formatCellValue,
  getColumnComparator,
  calculateTotals,
} from './table-columns'
export type { ColumnDef } from './table-columns'

// Grid Components (Story 62.1-FE)
export { DashboardMetricsGrid } from './DashboardMetricsGrid'
export type {
  DashboardMetricsGridProps,
  PreviousPeriodData,
  FinanceSummaryData,
} from './DashboardMetricsGrid'

// Re-export TheoreticalProfitResult from lib for convenience
export type { TheoreticalProfitResult } from '@/lib/theoretical-profit'

// Skeleton Components (Story 62.1-FE)
export { MetricCardSkeleton } from './DashboardMetricsGridSkeleton'
export type {
  DashboardMetricsGridSkeletonProps,
  MetricCardSkeletonProps,
} from './DashboardMetricsGridSkeleton'

// Metric Cards (Story 62.2-FE)
export { OrdersMetricCard } from './OrdersMetricCard'
export type { OrdersMetricCardProps } from './OrdersMetricCard'

// Empty State for FBS Orders (Issue #2)
export { EmptyStateFBS } from './EmptyStateFBS'
export type { EmptyStateFBSProps } from './EmptyStateFBS'

// FBO/FBS Fulfillment Components (Epic 60)
export { FulfillmentMetricCard } from './FulfillmentMetricCard'
export type { FulfillmentMetricCardProps } from './FulfillmentMetricCard'

export { EmptyStateFulfillment } from './EmptyStateFulfillment'
export type { EmptyStateFulfillmentProps } from './EmptyStateFulfillment'

// Placeholder (temporary, removed as real cards are implemented)
export { PlaceholderMetricCard } from './PlaceholderMetricCard'
export type { PlaceholderMetricCardProps } from './PlaceholderMetricCard'

// Daily Breakdown Chart (Story 62.6-FE)
export { DailyBreakdownChart } from './DailyBreakdownChart'
export type { DailyBreakdownChartProps } from './DailyBreakdownChart'

export { DailyBreakdownTooltip } from './DailyBreakdownTooltip'

export {
  ChartLoadingSkeleton,
  ChartErrorState,
  ChartEmptyState,
  ChartPartialDataWarning,
} from './DailyBreakdownChartStates'

// Interactive Legend (Story 62.7-FE)
export { MetricLegend } from './MetricLegend'
export type { MetricLegendProps } from './MetricLegend'

// Chart Configuration
export {
  CHART_COLORS,
  METRIC_LABELS,
  METRIC_AXIS,
  METRIC_SERIES,
  DEFAULT_VISIBLE_SERIES,
  STORAGE_KEY,
  CHART_DIMENSIONS,
  DAY_LABELS_RU,
  formatDayLabel,
  formatCompactCurrency,
  formatTooltipDate,
} from './chart-config'
export type { MetricSeries, MetricKey } from './chart-config'

// COGS by Orders Card (Story 62.3-FE)
export { OrdersCogsMetricCard } from './OrdersCogsMetricCard'
export type { OrdersCogsMetricCardProps } from './OrdersCogsMetricCard'

// Theoretical Profit Card (Story 62.4-FE)
export { TheoreticalProfitCard } from './TheoreticalProfitCard'
export type { TheoreticalProfitCardProps } from './TheoreticalProfitCard'

export { ProfitBreakdownPopover } from './ProfitBreakdownPopover'
export type { ProfitBreakdownPopoverProps } from './ProfitBreakdownPopover'

// Shared Metric Card States (Story 62.3-FE, 62.4-FE)
export {
  MetricCardError,
  StandardMetricSkeleton,
  HighlightedMetricSkeleton,
} from './MetricCardStates'
export type { MetricCardErrorProps, StandardSkeletonProps } from './MetricCardStates'

// Sales Metric Card (Story 63.1-FE)
export { SalesMetricCard } from './SalesMetricCard'
export type { SalesMetricCardProps } from './SalesMetricCard'

// Sales COGS Metric Card (Story 63.2-FE)
export { SalesCogsMetricCard } from './SalesCogsMetricCard'
export type { SalesCogsMetricCardProps } from './SalesCogsMetricCard'

// Storage Widgets (Story 63.5-FE, 63.6-FE)
export { StorageTopConsumersWidget } from './StorageTopConsumersWidget'
export type { StorageTopConsumersWidgetProps } from './StorageTopConsumersWidget'

export { StorageTrendsWidget } from './StorageTrendsWidget'
export type { StorageTrendsWidgetProps } from './StorageTrendsWidget'

export { StorageTrendsChart } from './StorageTrendsChart'
export type { StorageTrendsChartProps } from './StorageTrendsChart'

// Storage Widget Helper Components (Story 63.5-FE, 63.6-FE)
export { RankIndicator } from './RankIndicator'
export type { RankIndicatorProps } from './RankIndicator'

export { StorageRatioIndicator, getStorageRatioSeverity } from './StorageRatioIndicator'
export type { StorageRatioIndicatorProps, RatioSeverity } from './StorageRatioIndicator'

export { TrendBadge } from './TrendBadge'
export type { TrendBadgeProps } from './TrendBadge'

export { SummaryStats } from './SummaryStats'
export type { SummaryStatsProps } from './SummaryStats'

// Advertising Components (Story 63.3-FE, 63.4-FE)
export { AdvertisingSyncStatusBadge, EfficiencyFilterChips } from './advertising'
export type { AdvertisingSyncStatusBadgeProps, EfficiencyFilterChipsProps } from './advertising'

// Expense Structure Pie Chart (Story 63.9-FE)
export { ExpenseStructurePieChart } from './ExpenseStructurePieChart'
export type { ExpenseStructurePieChartProps } from './ExpenseStructurePieChart'
export { ExpenseChartSkeleton } from './ExpenseChartSkeleton'
export { ExpenseChartTooltip } from './ExpenseChartTooltip'
export { ExpenseChartLegend } from './ExpenseChartLegend'
export {
  EXPENSE_COLORS,
  transformToChartData,
  calculateTotalExpenses,
} from './expense-chart-config'
export type { ExpenseChartDataItem } from './expense-chart-config'

// Unit Economics Enhancement (Story 63.10-FE)
export { ProfitabilityBadge, getProfitabilityStatus } from './ProfitabilityBadge'
export type { ProfitabilityBadgeProps, ExtendedProfitabilityStatus } from './ProfitabilityBadge'

export { ProfitabilityFilter } from './ProfitabilityFilter'
export type { ProfitabilityFilterProps } from './ProfitabilityFilter'

export { UnitEconomicsSummaryBanner } from './UnitEconomicsSummaryBanner'
export type { UnitEconomicsSummaryBannerProps, StatusCount } from './UnitEconomicsSummaryBanner'

export { UnitEconomicsTable } from './UnitEconomicsTable'
export type { UnitEconomicsTableProps, SortField, SortOrder, SortState } from './UnitEconomicsTable'

export { UnitEconomicsTableHeader } from './UnitEconomicsTableHeader'
export type { UnitEconomicsTableHeaderProps } from './UnitEconomicsTableHeader'

export { UnitEconomicsTableRowComponent } from './UnitEconomicsTableRow'
export type { UnitEconomicsTableRowProps } from './UnitEconomicsTableRow'

// Orders Status Breakdown (Story 63.7-FE)
export { OrdersStatusBreakdown } from './OrdersStatusBreakdown'
export type { OrdersStatusBreakdownProps } from './OrdersStatusBreakdown'

export { StatusPieChart } from './StatusPieChart'
export type { StatusPieChartProps } from './StatusPieChart'

export { StatusStackedBar } from './StatusStackedBar'
export type { StatusStackedBarProps } from './StatusStackedBar'

export { StatusLegend } from './StatusLegend'
export type { StatusLegendProps } from './StatusLegend'

export { StatusTooltip } from './StatusTooltip'

// Seasonal Patterns (Story 63.8-FE)
export { OrdersSeasonalPatterns } from './OrdersSeasonalPatterns'
export type { OrdersSeasonalPatternsProps } from './OrdersSeasonalPatterns'

export { SeasonalInsightsCard } from './SeasonalInsightsCard'
export type { SeasonalInsightsCardProps } from './SeasonalInsightsCard'

export { MonthlyPatternsChart } from './MonthlyPatternsChart'
export type { MonthlyPatternsChartProps } from './MonthlyPatternsChart'

export { WeekdayPatternsChart } from './WeekdayPatternsChart'
export type { WeekdayPatternsChartProps } from './WeekdayPatternsChart'

export { PatternTooltip } from './PatternTooltip'

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
