'use client'

/**
 * ProductOverviewTab — overview summary for Unified Product Analytics (Story 120.6-FE).
 *
 * Renders key metrics from the /unified response summary + top-level funnel/advertising
 * totals in a KPI card grid. Uses formatCurrency/formatPercentage for Russian locale.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import type { UnifiedProductData } from '@/types/unified-product'

interface ProductOverviewTabProps {
  data: UnifiedProductData
}

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
}

function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

export function ProductOverviewTab({ data }: ProductOverviewTabProps) {
  const { funnel, advertising, organic, summary } = data
  const ft = funnel.totals
  const at = advertising.totals
  const ot = organic.totals

  return (
    <div className="space-y-6">
      {/* Traffic split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Органический трафик"
          value={formatPercentage(summary.organicTrafficShare)}
          subtitle={`${formatNumber(ot.organicViews)} просмотров`}
        />
        <KpiCard
          title="Рекламный трафик"
          value={formatPercentage(summary.adTrafficShare)}
          subtitle={`${formatNumber(at.views)} просмотров`}
        />
        <KpiCard
          title="Смешанная конверсия"
          value={formatPercentage(summary.blendedConversion)}
          subtitle="Заказы / Просмотры"
        />
        <KpiCard
          title="Рекламные расходы"
          value={formatCurrency(at.spend)}
          subtitle={`${formatNumber(at.clicks)} кликов`}
        />
      </div>

      {/* Funnel summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Открытия карт" value={formatNumber(ft.openCardCount)} />
        <KpiCard title="Добавления в корзину" value={formatNumber(ft.addToCartCount)} />
        <KpiCard title="Заказы" value={formatNumber(ft.ordersCount)} />
        <KpiCard title="Выкупы" value={formatNumber(ft.buyoutCount)} />
        <KpiCard title="Отмены" value={formatNumber(ft.cancelCount)} />
      </div>
    </div>
  )
}
