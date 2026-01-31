/**
 * Dashboard Metrics Grid Component
 * Story 62.1-FE: Redesign Dashboard Metrics Grid
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * 8-card responsive grid for dashboard metrics.
 * Card order matches business priority.
 *
 * @see docs/stories/epic-62/story-62.1-fe-redesign-dashboard-metrics-grid.md
 */

'use client'

import { cn } from '@/lib/utils'
import { DashboardMetricsGridSkeleton } from './DashboardMetricsGridSkeleton'
import { OrdersMetricCard } from './OrdersMetricCard'
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
  ordersAmount: number | undefined
  ordersCount: number | undefined
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
 * Row 1: Заказы | COGS заказов | Выкупы | COGS выкупов
 * Row 2: Реклама | Логистика | Хранение | Теор.прибыль*
 */
export function DashboardMetricsGrid({
  ordersAmount,
  ordersCount,
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
  if (isLoading && ordersAmount === undefined) {
    return <DashboardMetricsGridSkeleton className={className} />
  }

  return (
    <div
      className={cn(gridClasses, className)}
      role="region"
      aria-label="Основные метрики"
      aria-busy={isLoading}
    >
      {/* Card 1: Заказы (Orders Volume) */}
      <OrdersMetricCard
        totalAmount={ordersAmount}
        totalOrders={ordersCount}
        previousAmount={previousPeriodData?.ordersAmount}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
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
