/** Dashboard Metrics Grid — Card rendering section. Epic 66-FE: Tax + NetProfit. */

'use client'

import { SimpleMetricCard } from './SimpleMetricCard'
import { buildSimpleCards } from './simpleCardConfigs'
import { ProfitWaterfallCard } from './ProfitWaterfallCard'
import { SalesByPriceLevelCard } from './SalesByPriceLevelCard'
import { renderDetailCards } from './DashboardMetricsDetailCards'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'
import { useDashboardWidgetsStore, type WidgetId } from '@/stores/dashboardWidgetsStore'

/** Map simple card title prefix to widget ID */
const SIMPLE_CARD_WIDGET: Record<string, WidgetId> = {
  Заказы: 'orders',
  Выкупы: 'sales',
  Возвраты: 'returns',
}

/** Resolve which widget a simple card belongs to based on its title */
function resolveSimpleWidget(title: string): WidgetId | null {
  const prefix = Object.keys(SIMPLE_CARD_WIDGET).find(k => title.startsWith(k))
  return prefix ? (SIMPLE_CARD_WIDGET[prefix] ?? null) : null
}

function GridGroupHeading({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="col-span-full pt-1 first:pt-0">
      <h3 className="text-sm font-semibold text-muted-foreground">{children}</h3>
    </div>
  )
}

export function DashboardMetricsGridCards(props: DashboardMetricsGridProps): React.ReactElement {
  const { error, onRetry } = props

  const visibleWidgets = useDashboardWidgetsStore(s => s.visibleWidgets)
  const isVisible = (id: WidgetId | null) => id === null || visibleWidgets[id]

  const cards = buildSimpleCards(props).filter(c => isVisible(resolveSimpleWidget(c.title)))
  const e = error ?? undefined

  return (
    <>
      <GridGroupHeading>Итог, объём и продажи</GridGroupHeading>
      {/* TZ-2: replaces NetProfitCard + 5 profit detail cards. The 'grossProfit'/'margin'
          widget toggles are now no-ops until TZ-4 (persona presets) reworks the model —
          NetProfit must stay always-visible as the hero, so the card is not widget-gated. */}
      <ProfitWaterfallCard {...props} />
      {cards.map(c => (
        <SimpleMetricCard key={c.title} {...c} error={e} onRetry={onRetry} />
      ))}
      {/* TZ-3: the 4 revenue-by-price-level cards consolidated into one. */}
      <SalesByPriceLevelCard {...props} />
      <GridGroupHeading>Расходы, удержания и себестоимость</GridGroupHeading>
      {renderDetailCards(props, visibleWidgets)}
    </>
  )
}
