/**
 * Dashboard Metrics Grid — Flat responsive P&L layout
 * Single grid: 1col → 2col (sm) → 3col (lg) → 4col (xl)
 * 15 cards: 7 simple (data-driven) + 8 complex with tooltips/breakdowns.
 */

'use client'

import { cn } from '@/lib/utils'
import { DashboardMetricsGridSkeleton } from './DashboardMetricsGridSkeleton'
import { SimpleMetricCard } from './SimpleMetricCard'
import { buildSimpleCards } from './simpleCardConfigs'
import { WbCommissionsCard } from './WbCommissionsCard'
import { LogisticsMetricCard } from './LogisticsMetricCard'
import { PayoutCard } from './PayoutCard'
import { StorageAcceptanceCard } from './StorageAcceptanceCard'
import { CostsCard } from './CostsCard'
import { AdvertisingCard } from './AdvertisingCard'
import { GrossProfitCard } from './GrossProfitCard'
import { MarginCard } from './MarginCard'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

export type {
  DashboardMetricsGridProps,
  PreviousPeriodData,
  FinanceSummaryData,
} from './DashboardMetricsGridTypes'

const gridCls = cn(
  'grid gap-3 items-stretch',
  'grid-cols-1',
  'sm:grid-cols-2',
  'lg:grid-cols-3',
  'xl:grid-cols-4'
)

export function DashboardMetricsGrid(props: DashboardMetricsGridProps): React.ReactElement {
  const {
    commissionSales,
    acquiringFee,
    loyaltyFee,
    penaltiesTotal,
    wbCommissionAdj,
    wbServicesCost,
    logisticsCost,
    saleGross,
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

  if (isLoading) return <DashboardMetricsGridSkeleton cardCount={15} className={className} />

  const cards = buildSimpleCards(props)
  const e = error ?? undefined

  return (
    <div className={cn(gridCls, className)} role="region" aria-label="Основные метрики P&L">
      {cards.map(c => (
        <SimpleMetricCard key={c.title} {...c} error={e} onRetry={onRetry} />
      ))}
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
      <StorageAcceptanceCard
        storageCost={storageCost}
        paidAcceptanceCost={paidAcceptanceCost}
        previousTotal={prev?.storageAcceptanceTotal}
        saleGross={saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      <PayoutCard
        payoutTotal={payoutTotal}
        previousPayout={prev?.payoutTotal}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
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
