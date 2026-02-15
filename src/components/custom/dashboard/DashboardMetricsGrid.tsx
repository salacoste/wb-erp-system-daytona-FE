/**
 * Dashboard Metrics Grid — P&L Narrative Layout (Story 65.17)
 * Single responsive grid: 1col → 2col (md) → 3col (xl)
 * 10 cards in 5 sections with col-span-full section headers.
 *
 * Секция 1: ВЫРУЧКА      — Заказы | Продажи
 * Секция 2: РАСХОДЫ WB    — Комиссии WB | Логистика
 * Секция 3: К ПЕРЕЧИСЛЕНИЮ — К перечислению ★ | Хранение и приёмка
 * Секция 4: СЕБЕСТОИМОСТЬ  — Себестоимость | Реклама
 * Секция 5: ПРИБЫЛЬ       — Валовая прибыль ★ | Маржинальность ★
 */

'use client'

import { cn } from '@/lib/utils'
import { DashboardMetricsGridSkeleton } from './DashboardMetricsGridSkeleton'
import { SectionHeader } from './SectionHeader'
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

/** Responsive grid: 1col mobile, 2col tablet, 3col desktop */
const gridClasses = cn(
  'grid gap-4 items-stretch',
  'grid-cols-1',
  'md:grid-cols-2',
  'xl:grid-cols-3'
)

/**
 * Dashboard Metrics Grid — 5 sections x 2 cards, P&L narrative
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
    <div
      className={cn(gridClasses, className)}
      role="region"
      aria-label="Основные метрики P&L"
      aria-busy={isLoading}
    >
      {/* Секция 1: ВЫРУЧКА */}
      <SectionHeader title="ВЫРУЧКА" />
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

      {/* Секция 2: РАСХОДЫ WB */}
      <SectionHeader title="РАСХОДЫ WB" />
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

      {/* Секция 3: К ПЕРЕЧИСЛЕНИЮ */}
      <SectionHeader title="К ПЕРЕЧИСЛЕНИЮ" />
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

      {/* Секция 4: СЕБЕСТОИМОСТЬ И РЕКЛАМА */}
      <SectionHeader title="СЕБЕСТОИМОСТЬ И РЕКЛАМА" />
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

      {/* Секция 5: ПРИБЫЛЬ */}
      <SectionHeader title="ПРИБЫЛЬ" />
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
      />
    </div>
  )
}
