/** Dashboard Metrics Grid — 20 P&L cards. Epic 66-FE: Tax + NetProfit + pre-tax labels. */

'use client'

import { cn } from '@/lib/utils'
import { DashboardMetricsGridSkeleton } from './DashboardMetricsGridSkeleton'
import { SimpleMetricCard } from './SimpleMetricCard'
import { buildSimpleCards } from './simpleCardConfigs'
import { WbCommissionsCard } from './WbCommissionsCard'
import { LogisticsMetricCard } from './LogisticsMetricCard'
import { PayoutCard } from './PayoutCard'
import { StorageAcceptanceCard } from './StorageAcceptanceCard'
import { PaidAcceptanceCard } from './PaidAcceptanceCard'
import { CostsCard } from './CostsCard'
import { AdvertisingCard } from './AdvertisingCard'
import { GrossProfitCard } from './GrossProfitCard'
import { OperatingProfitCard } from './OperatingProfitCard'
import { GrossMarginCard } from './GrossMarginCard'
import { MarginCard } from './MarginCard'
import { TaxCard } from './TaxCard'
import { NetProfitCard } from './NetProfitCard'
import { OtherDeductionsCard } from './OtherDeductionsCard'
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
    wbPromotionCost,
    wbJamCost,
    wbOtherServicesCost,
    grossProfit,
    marginPct,
    // Request #155: Analytical profit/margin
    grossProfitAnalytical,
    operatingProfitAnalytical,
    operatingMarginPct,
    grossMarginPct,
    // Epic 66-FE: Tax & VAT
    taxMetrics,
    previousPeriodData: prev,
    isLoading,
    error,
    onRetry,
    onAssignCogs,
    className,
  } = props

  if (isLoading) return <DashboardMetricsGridSkeleton cardCount={18} className={className} />

  const showPreTaxLabel = !taxMetrics
  const cards = buildSimpleCards(props)
  const e = error ?? undefined

  return (
    <div className={cn(gridCls, className)} role="region" aria-label="Основные метрики P&L">
      <NetProfitCard
        taxMetrics={taxMetrics ?? null}
        payoutTotal={payoutTotal ?? null}
        saleGrossTotal={saleGross ?? null}
        previousTaxMetrics={prev?.taxMetrics ?? null}
        previousPayoutTotal={prev?.payoutTotal ?? null}
        isLoading={false}
      />
      {cards.map(c => (
        <SimpleMetricCard key={c.title} {...c} error={e} onRetry={onRetry} />
      ))}
      <WbCommissionsCard
        commissionSales={commissionSales}
        acquiringFee={acquiringFee}
        loyaltyFee={loyaltyFee}
        penaltiesTotal={penaltiesTotal}
        wbCommissionAdj={wbCommissionAdj}
        wbServicesCost={undefined}
        previousTotal={prev?.wbCommissionsTotal}
        saleGross={saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      <OtherDeductionsCard
        jamCost={wbJamCost}
        otherServicesCost={wbOtherServicesCost}
        previousTotal={prev?.wbOtherDeductionsTotal}
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
        previousTotal={prev?.storageCost}
        saleGross={saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      <PaidAcceptanceCard
        paidAcceptanceCost={paidAcceptanceCost}
        previousPaidAcceptanceCost={prev?.paidAcceptanceCost}
        saleGross={saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      <PayoutCard
        payoutTotal={payoutTotal}
        previousPayout={prev?.payoutTotal}
        showPreTaxLabel={showPreTaxLabel}
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
        wbPromotionCost={wbPromotionCost}
        previousWbPromotionCost={prev?.wbPromotionCost}
        previousSpend={prev?.advertisingSpend}
        saleGross={saleGross}
        isLoading={false}
        error={error}
        onRetry={onRetry}
      />
      <GrossProfitCard
        grossProfit={grossProfitAnalytical}
        previousGrossProfit={prev?.grossProfitAnalytical}
        cogsCoverage={cogsCoverage}
        showPreTaxLabel={showPreTaxLabel}
        isLoading={false}
        error={error}
        onRetry={onRetry}
        onAssignCogs={onAssignCogs}
      />
      <OperatingProfitCard
        operatingProfit={operatingProfitAnalytical ?? grossProfit}
        previousOperatingProfit={prev?.operatingProfitAnalytical ?? prev?.grossProfit}
        cogsCoverage={cogsCoverage}
        showPreTaxLabel={showPreTaxLabel}
        isLoading={false}
        error={error}
        onRetry={onRetry}
        onAssignCogs={onAssignCogs}
      />
      <GrossMarginCard
        grossMarginPct={grossMarginPct}
        previousGrossMarginPct={prev?.grossMarginPct}
        cogsCoverage={cogsCoverage}
        isLoading={false}
        error={error}
        onRetry={onRetry}
        onAssignCogs={onAssignCogs}
      />
      <MarginCard
        marginPct={operatingMarginPct ?? marginPct}
        previousMarginPct={prev?.operatingMarginPct ?? prev?.marginPct}
        cogsCoverage={cogsCoverage}
        showPreTaxLabel={showPreTaxLabel}
        isLoading={false}
        error={error}
        onRetry={onRetry}
        onAssignCogs={onAssignCogs}
      />
      <TaxCard
        taxMetrics={taxMetrics ?? null}
        previousTaxMetrics={prev?.taxMetrics ?? null}
        isLoading={false}
      />
    </div>
  )
}
