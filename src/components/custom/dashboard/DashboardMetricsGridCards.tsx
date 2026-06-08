/** Dashboard Metrics Grid — Card rendering section. Epic 66-FE: Tax + NetProfit. */

'use client'

import { SimpleMetricCard } from './SimpleMetricCard'
import { buildSimpleCards } from './simpleCardConfigs'
import { NetProfitCard } from './NetProfitCard'
import { renderDetailCards } from './DashboardMetricsDetailCards'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

export function renderGridCards(props: DashboardMetricsGridProps): React.ReactElement {
  const {
    saleGross,
    payoutTotal,
    grossProfit,
    operatingProfitAnalytical,
    taxMetrics,
    previousPeriodData: prev,
    error,
    onRetry,
  } = props

  const cards = buildSimpleCards(props)
  const e = error ?? undefined

  return (
    <>
      <NetProfitCard
        taxMetrics={taxMetrics ?? null}
        payoutTotal={payoutTotal ?? null}
        saleGrossTotal={saleGross ?? null}
        operatingProfit={operatingProfitAnalytical ?? grossProfit ?? null}
        previousTaxMetrics={prev?.taxMetrics ?? null}
        previousPayoutTotal={prev?.payoutTotal ?? null}
        previousOperatingProfit={prev?.operatingProfitAnalytical ?? prev?.grossProfit ?? null}
        isLoading={false}
      />
      {cards.map(c => (
        <SimpleMetricCard key={c.title} {...c} error={e} onRetry={onRetry} />
      ))}
      {renderDetailCards(props)}
    </>
  )
}
