/**
 * Dashboard Metrics Grid Component
 * Story 62.1-FE: Redesign Dashboard Metrics Grid
 * Epic 62-FE: Dashboard UI/UX Presentation
 * Epic 60: FBO/FBS Order Analytics Separation
 *
 * 8-card responsive grid for dashboard metrics.
 * Card order matches business priority.
 * Card 1 now shows FBO/FBS combined orders with share breakdown.
 *
 * @see docs/stories/epic-62/story-62.1-fe-redesign-dashboard-metrics-grid.md
 * @see docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md
 */

'use client'

import { cn } from '@/lib/utils'
import { DashboardMetricsGridSkeleton } from './DashboardMetricsGridSkeleton'
import { FulfillmentMetricCard } from './FulfillmentMetricCard'
import { OrdersCogsMetricCard } from './OrdersCogsMetricCard'
import { SalesMetricCard } from './SalesMetricCard'
import { SalesCogsMetricCard } from './SalesCogsMetricCard'
import { TheoreticalProfitCard } from './TheoreticalProfitCard'
import { AdvertisingMetricCard } from './AdvertisingMetricCard'
import { LogisticsMetricCard } from './LogisticsMetricCard'
import { StorageMetricCard } from './StorageMetricCard'
import type { TheoreticalProfitResult } from '@/lib/theoretical-profit'

// =============================================================================
// Types
// =============================================================================

export interface PreviousPeriodData {
  ordersAmount: number | null
  ordersCogs: number | null
  salesAmount: number | null
  salesCogs: number | null
  advertisingSpend: number | null
  logisticsCost: number | null
  storageCost: number | null
  theoreticalProfit: number | null
}

export interface FinanceSummaryData {
  revenue?: number | null
  logistics_cost?: number | null
  storage_cost?: number | null
  sale_gross_total?: number | null
}

export interface DashboardMetricsGridProps {
  // FBO/FBS Fulfillment metrics (Epic 60)
  fboOrdersCount?: number
  fboOrdersRevenue?: number
  fbsOrdersCount?: number
  fbsOrdersRevenue?: number
  fboShare?: number
  fbsShare?: number
  previousFulfillmentRevenue?: number
  isFulfillmentDataAvailable?: boolean
  onStartFulfillmentSync?: () => void
  isFulfillmentSyncLoading?: boolean
  fulfillmentError?: Error | null
  isFulfillmentLoading?: boolean
  // COGS metrics
  ordersCogs: number | undefined
  salesAmount: number | undefined
  salesCogs: number | undefined
  advertisingSpend: number | undefined
  logisticsCost: number | undefined
  storageCost: number | undefined
  revenueTotal: number | undefined
  theoreticalProfit: TheoreticalProfitResult | undefined
  productsWithCogs: number
  totalProducts: number
  cogsCoverage: number
  previousPeriodData: PreviousPeriodData | undefined
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
  onAssignCogs?: () => void
  className?: string
}

/** Responsive grid: 4 cols (xl), 2 cols (md), 1 col (sm) */
const gridClasses = cn('grid gap-4', 'grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-4')

/**
 * Dashboard Metrics Grid - 8-card responsive layout
 *
 * Row 1: Заказы FBO/FBS | COGS заказов | Выкупы | COGS выкупов
 * Row 2: Реклама | Логистика | Хранение | Теор.прибыль*
 */
export function DashboardMetricsGrid({
  fboOrdersCount,
  fboOrdersRevenue,
  fbsOrdersCount,
  fbsOrdersRevenue,
  fboShare,
  fbsShare,
  previousFulfillmentRevenue,
  isFulfillmentDataAvailable,
  onStartFulfillmentSync,
  isFulfillmentSyncLoading,
  fulfillmentError,
  isFulfillmentLoading,
  ordersCogs,
  salesAmount,
  salesCogs,
  advertisingSpend,
  logisticsCost,
  storageCost,
  revenueTotal,
  theoreticalProfit,
  productsWithCogs,
  totalProducts,
  cogsCoverage,
  previousPeriodData,
  isLoading,
  error,
  onRetry,
  onAssignCogs,
  className,
}: DashboardMetricsGridProps): React.ReactElement {
  // Show skeleton only when main data is loading (not fulfillment)
  if (isLoading) {
    return <DashboardMetricsGridSkeleton className={className} />
  }

  return (
    <div
      className={cn(gridClasses, className)}
      role="region"
      aria-label="Основные метрики"
      aria-busy={isLoading}
    >
      {/* Card 1: Заказы FBO/FBS (Epic 60) */}
      <FulfillmentMetricCard
        fboOrdersCount={fboOrdersCount}
        fboOrdersRevenue={fboOrdersRevenue}
        fbsOrdersCount={fbsOrdersCount}
        fbsOrdersRevenue={fbsOrdersRevenue}
        fboShare={fboShare}
        fbsShare={fbsShare}
        previousTotalRevenue={previousFulfillmentRevenue}
        isDataAvailable={isFulfillmentDataAvailable}
        isLoading={isFulfillmentLoading}
        error={fulfillmentError}
        onRetry={onRetry}
        onStartSync={onStartFulfillmentSync}
        isSyncLoading={isFulfillmentSyncLoading}
      />

      {/* Card 2: COGS заказов */}
      <OrdersCogsMetricCard
        cogsTotal={ordersCogs}
        previousCogsTotal={previousPeriodData?.ordersCogs}
        productsWithCogs={productsWithCogs}
        totalProducts={totalProducts}
        cogsCoverage={cogsCoverage}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        onAssignCogs={onAssignCogs}
      />

      {/* Card 3: Выкупы (Sales from wb_sales_gross) */}
      <SalesMetricCard
        salesGross={salesAmount}
        previousSalesGross={previousPeriodData?.salesAmount}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
      />

      {/* Card 4: COGS выкупов (from finance-summary cogs_total) */}
      <SalesCogsMetricCard
        cogsTotal={salesCogs}
        previousCogsTotal={previousPeriodData?.salesCogs}
        productsWithCogs={productsWithCogs}
        totalProducts={totalProducts}
        cogsCoverage={cogsCoverage}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        onAssignCogs={onAssignCogs}
      />

      {/* Card 5: Реклама */}
      <AdvertisingMetricCard
        totalSpend={advertisingSpend}
        previousSpend={previousPeriodData?.advertisingSpend}
        revenueTotal={revenueTotal}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
      />

      {/* Card 6: Логистика */}
      <LogisticsMetricCard
        logisticsCost={logisticsCost}
        previousLogisticsCost={previousPeriodData?.logisticsCost}
        revenueTotal={revenueTotal}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
      />

      {/* Card 7: Хранение */}
      <StorageMetricCard
        storageCost={storageCost}
        previousStorageCost={previousPeriodData?.storageCost}
        revenueTotal={revenueTotal}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
      />

      {/* Card 8: Теор.прибыль (highlighted) */}
      <TheoreticalProfitCard
        profit={theoreticalProfit}
        previousProfit={previousPeriodData?.theoreticalProfit}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
      />
    </div>
  )
}
