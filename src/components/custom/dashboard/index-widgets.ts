/**
 * Dashboard Widgets Sub-Barrel
 * Epic 62-FE / 63-FE: Charts, widgets, analytics sections
 *
 * Split from index.ts for file-size compliance (Epic 74)
 */

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

// Period Comparison, Historical Trends, Trends Config, Inventory Summary
// extracted to index-widgets-extended.ts for file-size compliance
export * from './index-widgets-extended'
