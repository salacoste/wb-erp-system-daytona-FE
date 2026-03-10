/**
 * Dashboard Metrics Sub-Barrel
 * Epic 62-FE: Dashboard UI/UX - Metric cards, skeletons, daily breakdown
 *
 * Split from index.ts for file-size compliance (Epic 74)
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

// P&L Section Cards (Dashboard Restructuring v2)
export { OrdersCard } from './OrdersCard'
export type { OrdersCardProps } from './OrdersCard'

export { SalesNetCard } from './SalesNetCard'
export type { SalesNetCardProps } from './SalesNetCard'

export { WbCommissionsCard } from './WbCommissionsCard'
export type { WbCommissionsCardProps } from './WbCommissionsCard'

export { LogisticsMetricCard } from './LogisticsMetricCard'
export type { LogisticsMetricCardProps } from './LogisticsMetricCard'

export { PayoutCard } from './PayoutCard'
export type { PayoutCardProps } from './PayoutCard'

export { StorageAcceptanceCard } from './StorageAcceptanceCard'
export type { StorageAcceptanceCardProps } from './StorageAcceptanceCard'

export { PaidAcceptanceCard } from './PaidAcceptanceCard'
export type { PaidAcceptanceCardProps } from './PaidAcceptanceCard'

export { OtherDeductionsCard } from './OtherDeductionsCard'
export type { OtherDeductionsCardProps } from './OtherDeductionsCard'

export { CostsCard } from './CostsCard'
export type { CostsCardProps } from './CostsCard'

export { AdvertisingCard } from './AdvertisingCard'
export type { AdvertisingCardProps } from './AdvertisingCard'

export { GrossProfitCard } from './GrossProfitCard'
export type { GrossProfitCardProps } from './GrossProfitCard'

// Request #155: Operating Profit (renamed from old "Валовая прибыль")
export { OperatingProfitCard } from './OperatingProfitCard'
export type { OperatingProfitCardProps } from './OperatingProfitCard'

export { MarginCard } from './MarginCard'
export type { MarginCardProps } from './MarginCard'

// Request #155: Gross Margin (new analytical card)
export { GrossMarginCard } from './GrossMarginCard'
export type { GrossMarginCardProps } from './GrossMarginCard'

// Epic 66-FE: Tax & VAT Cards (backend-calculated)
export { TaxCard } from './TaxCard'
export type { TaxCardProps } from './TaxCard'

export { NetProfitCard } from './NetProfitCard'
export type { NetProfitCardProps } from './NetProfitCard'

// Story 66.7-FE: Tax Warning Banner
export { TaxWarningBanner } from './TaxWarningBanner'
export type { TaxWarningBannerProps } from './TaxWarningBanner'

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

// Data Availability Indicators (Dashboard Enhancement)
export { DataAvailabilityBadge } from './DataAvailabilityBadge'
export type { DataAvailabilityBadgeProps } from './DataAvailabilityBadge'

export { IncompleteWeekBanner } from './IncompleteWeekBanner'
export type { IncompleteWeekBannerProps } from './IncompleteWeekBanner'
