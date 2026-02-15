/**
 * Dashboard Metrics Grid — Flat responsive P&L layout
 * Single grid: 1col → 2col (sm) → 3col (lg) → 4col (xl)
 * 10 cards flowing in P&L order without section wrappers.
 */

'use client'

import { cn } from '@/lib/utils'
import { DashboardMetricsGridSkeleton } from './DashboardMetricsGridSkeleton'
import { OrdersCard } from './OrdersCard'
import { SalesNetCard } from './SalesNetCard'
import { WbCommissionsCard } from './WbCommissionsCard'
import { LogisticsMetricCard } from './LogisticsMetricCard'
import { PayoutCard } from './PayoutCard'
import { StorageAcceptanceCard } from './StorageAcceptanceCard'
import { CostsCard } from './CostsCard'
import { AdvertisingCard } from './AdvertisingCard'
import { GrossProfitCard } from './GrossProfitCard'
import { MarginCard } from './MarginCard'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

// Re-export types for backward compatibility
export type {
  DashboardMetricsGridProps,
  PreviousPeriodData,
  FinanceSummaryData,
} from './DashboardMetricsGridTypes'

/** Flat responsive grid: 1 → 2 → 3 → 4 columns */
const gridClasses = cn(
  'grid gap-3 items-stretch',
  'grid-cols-1',
  'sm:grid-cols-2',
  'lg:grid-cols-3',
  'xl:grid-cols-4'
)

/**
 * Dashboard Metrics Grid — flat 10-card P&L layout
 */
export function DashboardMetricsGrid(props: DashboardMetricsGridProps): React.ReactElement {
  const {
    totalOrders,
    saleGross,
    wbSalesGross,
    wbReturnsGross,
    commissionSales,
    acquiringFee,
    loyaltyFee,
    penaltiesTotal,
    wbCommissionAdj,
    wbServicesCost,
    logisticsCost,
    payoutTotal,
    storageCost,
    paidAcceptanceCost,
    cogsTotal,
    cogsCoverage,
    productsWithCogs,
    totalProducts,
    advertisingSpend,
    advertisingRoas,
    grossProfit,
    marginPct,
    previousPeriodData: prev,
    isLoading,
    error,
    onRetry,
    onAssignCogs,
    className,
  } = props

  if (isLoading) {
    return <DashboardMetricsGridSkeleton className={className} />
  }

  return (
    <div className={cn(gridClasses, className)} role="region" aria-label="Основные метрики P&L">
      {/* Выручка */}
      <OrdersCard
        totalOrders={totalOrders}
        previousOrders={prev?.ordersCount}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      <SalesNetCard
        saleGross={saleGross}
        wbSalesGross={wbSalesGross}
        wbReturnsGross={wbReturnsGross}
        previousSaleGross={prev?.saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      {/* Расходы WB */}
      <WbCommissionsCard
        commissionSales={commissionSales}
        acquiringFee={acquiringFee}
        loyaltyFee={loyaltyFee}
        penaltiesTotal={penaltiesTotal}
        wbCommissionAdj={wbCommissionAdj}
        wbServicesCost={wbServicesCost}
        previousTotal={prev?.wbCommissionsTotal}
        saleGross={saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      <LogisticsMetricCard
        logisticsCost={logisticsCost}
        previousLogisticsCost={prev?.logisticsCost}
        revenueTotal={saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      {/* К перечислению */}
      <PayoutCard
        payoutTotal={payoutTotal}
        previousPayout={prev?.payoutTotal}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      <StorageAcceptanceCard
        storageCost={storageCost}
        paidAcceptanceCost={paidAcceptanceCost}
        previousTotal={prev?.storageAcceptanceTotal}
        saleGross={saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      {/* Себестоимость и реклама */}
      <CostsCard
        cogsTotal={cogsTotal}
        previousCogs={prev?.cogsTotal}
        cogsCoverage={cogsCoverage}
        productsWithCogs={productsWithCogs}
        totalProducts={totalProducts}
        isLoading={false}
        error={error}
        onRetry={onRetry}
        onAssignCogs={onAssignCogs}
      />
      <AdvertisingCard
        totalSpend={advertisingSpend}
        roas={advertisingRoas}
        previousSpend={prev?.advertisingSpend}
        saleGross={saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      {/* Прибыль */}
      <GrossProfitCard
        grossProfit={grossProfit}
        previousGrossProfit={prev?.grossProfit}
        cogsCoverage={cogsCoverage}
        isLoading={false}
        error={error}
        onRetry={onRetry}
        onAssignCogs={onAssignCogs}
      />
      <MarginCard
        marginPct={marginPct}
        previousMarginPct={prev?.marginPct}
        cogsCoverage={cogsCoverage}
        isLoading={false}
        error={error}
        onRetry={onRetry}
        onAssignCogs={onAssignCogs}
      />
    </div>
  )
}
