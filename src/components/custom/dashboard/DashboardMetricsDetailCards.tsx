/** Detail cards section for Dashboard Metrics Grid — lower half of the card grid. */

'use client'

import { WbCommissionsCard } from './WbCommissionsCard'
import { LogisticsMetricCard } from './LogisticsMetricCard'
import { PayoutCard } from './PayoutCard'
import { StorageAcceptanceCard } from './StorageAcceptanceCard'
import { CostsCard } from './CostsCard'
import { AdvertisingCard } from './AdvertisingCard'
import { OtherDeductionsCard } from './OtherDeductionsCard'
import { getWbDeductions, type DashboardMetricsGridProps } from './DashboardMetricsGridTypes'
import type { WidgetId } from '@/stores/dashboardWidgetsStore'

export function renderDetailCards(
  props: DashboardMetricsGridProps,
  vw?: Record<WidgetId, boolean>
): React.ReactElement {
  const p = props
  const prev = p.previousPeriodData
  const wbDeductions = getWbDeductions(p)
  const preTax = !p.taxMetrics
  const s = (id: WidgetId) => !vw || vw[id] !== false

  return (
    <>
      {s('commissions') && (
        <>
          <WbCommissionsCard
            commissionSales={wbDeductions.commission.commissionSales}
            acquiringFee={wbDeductions.commission.acquiringFee}
            loyaltyFee={wbDeductions.commission.loyaltyFee}
            penaltiesTotal={wbDeductions.commission.penaltiesTotal}
            wbCommissionAdj={wbDeductions.commission.wbCommissionAdj}
            previousTotal={wbDeductions.commission.previousTotal}
            saleGross={wbDeductions.saleGross}
            isLoading={false}
            error={p.error}
            onRetry={p.onRetry}
          />
          <OtherDeductionsCard
            jamCost={wbDeductions.services.jamCost}
            otherServicesCost={wbDeductions.services.otherServicesCost}
            previousTotal={wbDeductions.services.previousTotal}
            saleGross={wbDeductions.saleGross}
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
        <StorageAcceptanceCard
          storageCost={p.storageCost}
          paidAcceptanceCost={p.paidAcceptanceCost}
          previousTotal={prev?.storageAcceptanceTotal}
          saleGross={p.saleGross}
          isLoading={false}
          error={p.error}
          onRetry={p.onRetry}
        />
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
          isLoading={false}
          error={p.error}
          onRetry={p.onRetry}
        />
      )}
      {s('advertising') && (
        <AdvertisingCard
          totalSpend={wbDeductions.promotion.advertisingSpend}
          roas={wbDeductions.promotion.advertisingRoas}
          wbPromotionCost={wbDeductions.promotion.wbPromotionCost}
          previousWbPromotionCost={wbDeductions.promotion.previousWbPromotionCost}
          previousSpend={wbDeductions.promotion.previousAdvertisingSpend}
          saleGross={wbDeductions.saleGross}
          isLoading={false}
          error={p.error}
          onRetry={p.onRetry}
        />
      )}
      {/* TZ-2: gross/operating/margin/tax cards merged into ProfitWaterfallCard. */}
    </>
  )
}
