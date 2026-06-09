/** Profit & margin detail cards — gross profit, operating profit, margins, tax. */

import { GrossProfitCard } from './GrossProfitCard'
import { OperatingProfitCard } from './OperatingProfitCard'
import { GrossMarginCard } from './GrossMarginCard'
import { MarginCard } from './MarginCard'
import { TaxCard } from './TaxCard'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'
import type { WidgetId } from '@/stores/dashboardWidgetsStore'

export function renderProfitDetailCards(
  props: DashboardMetricsGridProps,
  show: (id: WidgetId) => boolean
): React.ReactElement {
  const p = props
  const prev = p.previousPeriodData
  const preTax = !p.taxMetrics

  return (
    <>
      {show('grossProfit') && (
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
      {show('margin') && (
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
