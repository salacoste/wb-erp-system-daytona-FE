/** Detail cards section for Dashboard Metrics Grid — lower half of the card grid. */

'use client'

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
import { OtherDeductionsCard } from './OtherDeductionsCard'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'
import type { WidgetId } from '@/stores/dashboardWidgetsStore'

export function renderDetailCards(
  props: DashboardMetricsGridProps,
  vw?: Record<WidgetId, boolean>
): React.ReactElement {
  const p = props
  const prev = p.previousPeriodData
  const preTax = !p.taxMetrics
  const s = (id: WidgetId) => !vw || vw[id] !== false

  return (
    <>
      {s('commissions') && (
        <>
          <WbCommissionsCard
            commissionSales={p.commissionSales}
            acquiringFee={p.acquiringFee}
            loyaltyFee={p.loyaltyFee}
            penaltiesTotal={p.penaltiesTotal}
            wbCommissionAdj={p.wbCommissionAdj}
            wbServicesCost={undefined}
            previousTotal={prev?.wbCommissionsTotal}
            saleGross={p.saleGross}
            isLoading={false}
            error={p.error}
            onRetry={p.onRetry}
          />
          <OtherDeductionsCard
            jamCost={p.wbJamCost}
            otherServicesCost={p.wbOtherServicesCost}
            previousTotal={prev?.wbOtherDeductionsTotal}
            saleGross={p.saleGross}
            isLoading={false}
            error={p.error}
            onRetry={p.onRetry}
          />
        </>
      )}
      {s('logistics') && (
        <LogisticsMetricCard
          logisticsCost={p.logisticsCost}
          previousLogisticsCost={prev?.logisticsCost}
          revenueTotal={p.saleGross}
          logisticsBreakdown={p.logisticsBreakdown}
          isLoading={false}
          error={p.error}
          onRetry={p.onRetry}
        />
      )}
      {s('storage') && (
        <>
          <StorageAcceptanceCard
            storageCost={p.storageCost}
            paidAcceptanceCost={p.paidAcceptanceCost}
            previousTotal={prev?.storageCost}
            saleGross={p.saleGross}
            isLoading={false}
            error={p.error}
            onRetry={p.onRetry}
          />
          <PaidAcceptanceCard
            paidAcceptanceCost={p.paidAcceptanceCost}
            previousPaidAcceptanceCost={prev?.paidAcceptanceCost}
            saleGross={p.saleGross}
            isLoading={false}
            error={p.error}
            onRetry={p.onRetry}
          />
        </>
      )}
      {s('payout') && (
        <PayoutCard
          payoutTotal={p.payoutTotal}
          previousPayout={prev?.payoutTotal}
          showPreTaxLabel={preTax}
          isLoading={false}
          error={p.error}
          onRetry={p.onRetry}
        />
      )}
      {s('cogs') && (
        <CostsCard
          cogsTotal={p.cogsTotal}
          previousCogs={prev?.cogsTotal}
          cogsCoverage={p.cogsCoverage}
          productsWithCogs={p.productsWithCogs}
          totalProducts={p.totalProducts}
          isLoading={false}
          error={p.error}
          onRetry={p.onRetry}
          onAssignCogs={p.onAssignCogs}
        />
      )}
      {s('advertising') && (
        <AdvertisingCard
          totalSpend={p.advertisingSpend}
          roas={p.advertisingRoas}
          wbPromotionCost={p.wbPromotionCost}
          previousWbPromotionCost={prev?.wbPromotionCost}
          previousSpend={prev?.advertisingSpend}
          saleGross={p.saleGross}
          isLoading={false}
          error={p.error}
          onRetry={p.onRetry}
        />
      )}
      {s('grossProfit') && (
        <>
          <GrossProfitCard
            grossProfit={p.grossProfitAnalytical}
            previousGrossProfit={prev?.grossProfitAnalytical}
            cogsCoverage={p.cogsCoverage}
            showPreTaxLabel={preTax}
            isLoading={false}
            error={p.error}
            onRetry={p.onRetry}
            onAssignCogs={p.onAssignCogs}
          />
          <OperatingProfitCard
            operatingProfit={p.operatingProfitAnalytical ?? p.grossProfit}
            previousOperatingProfit={prev?.operatingProfitAnalytical ?? prev?.grossProfit}
            cogsCoverage={p.cogsCoverage}
            showPreTaxLabel={preTax}
            isLoading={false}
            error={p.error}
            onRetry={p.onRetry}
            onAssignCogs={p.onAssignCogs}
          />
        </>
      )}
      {s('margin') && (
        <>
          <GrossMarginCard
            grossMarginPct={p.grossMarginPct}
            previousGrossMarginPct={prev?.grossMarginPct}
            cogsCoverage={p.cogsCoverage}
            isLoading={false}
            error={p.error}
            onRetry={p.onRetry}
            onAssignCogs={p.onAssignCogs}
          />
          <MarginCard
            marginPct={p.operatingMarginPct ?? p.marginPct}
            previousMarginPct={prev?.operatingMarginPct ?? prev?.marginPct}
            cogsCoverage={p.cogsCoverage}
            showPreTaxLabel={preTax}
            isLoading={false}
            error={p.error}
            onRetry={p.onRetry}
            onAssignCogs={p.onAssignCogs}
          />
          <TaxCard
            taxMetrics={p.taxMetrics ?? null}
            previousTaxMetrics={prev?.taxMetrics ?? null}
            isLoading={false}
          />
        </>
      )}
    </>
  )
}
