/** Dashboard Metrics Grid — Card rendering section. Epic 66-FE: Tax + NetProfit. */

'use client'

import { SimpleMetricCard } from './SimpleMetricCard'
import { buildSimpleCards } from './simpleCardConfigs'
import { NetProfitCard } from './NetProfitCard'
import { renderDetailCards } from './DashboardMetricsDetailCards'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'
import { useDashboardWidgetsStore, type WidgetId } from '@/stores/dashboardWidgetsStore'

/** Map simple card title prefix to widget ID */
const SIMPLE_CARD_WIDGET: Record<string, WidgetId> = {
  Заказы: 'orders',
  Выкупы: 'sales',
  Возвраты: 'returns',
  Продажи: 'sales',
}

/** Resolve which widget a simple card belongs to based on its title */
function resolveSimpleWidget(title: string): WidgetId | null {
  const prefix = Object.keys(SIMPLE_CARD_WIDGET).find(k => title.startsWith(k))
  return prefix ? (SIMPLE_CARD_WIDGET[prefix] ?? null) : null
}

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

  const visibleWidgets = useDashboardWidgetsStore(s => s.visibleWidgets)
  const isVisible = (id: WidgetId | null) => id === null || visibleWidgets[id]

  const cards = buildSimpleCards(props).filter(c => isVisible(resolveSimpleWidget(c.title)))
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
      {renderDetailCards(props, visibleWidgets)}
    </>
  )
}
