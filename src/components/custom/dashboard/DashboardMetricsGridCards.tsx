/** Dashboard Metrics Grid — Card rendering section. Epic 66-FE: Tax + NetProfit. */

'use client'

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

export function renderGridCards(props: DashboardMetricsGridProps): React.ReactElement {
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
    grossProfitAnalytical,
    operatingProfitAnalytical,
    operatingMarginPct,
    grossMarginPct,
    marginPct,
    taxMetrics,
    previousPeriodData: prev,
    error,
    onRetry,
    onAssignCogs,
  } = props

  const showPreTaxLabel = !taxMetrics
  const cards = buildSimpleCards(props)
  const e = error ?? undefined

  return (
    <>
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
    </>
  )
}
