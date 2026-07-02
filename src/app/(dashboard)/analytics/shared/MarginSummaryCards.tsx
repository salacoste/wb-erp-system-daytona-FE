'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { formatPercentage } from '@/lib/utils'
import { getValueColorClass } from '@/components/custom/sku-financials/sku-table-formatters'

export interface MarginStats {
  total: number
  totalRevenue: number
  totalProfit: number
  avgMargin: number | null
  totalMissingCogs: number
}

interface MarginSummaryCardsProps {
  stats: MarginStats
  entityNameDative: string
  entityNameGenitive: string
}

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

/**
 * Shared summary statistics cards for margin analysis pages (brand/category).
 * Shows average margin and coverage stats.
 * Story 4.6.
 */
export function MarginSummaryCards({
  stats,
  entityNameDative,
  entityNameGenitive,
}: MarginSummaryCardsProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Средняя маржа
          </CardTitle>
          <CardDescription>За выбранный период</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {stats.avgMargin !== null ? formatPercentage(stats.avgMargin, 2) : '—'}
            </span>
            <span className="text-sm text-muted-foreground">операционная маржа</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Выручка − COGS − Все расходы</p>
          <p className="mt-2 text-sm text-muted-foreground">
            По {stats.total} {entityNameDative}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Охват</CardTitle>
          <CardDescription>Статистика по себестоимости</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Всего {entityNameGenitive}:</span>
              <span className="font-semibold text-foreground">{stats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Общая выручка:</span>
              <span className="font-semibold text-foreground">
                {currencyFormatter.format(stats.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Общая прибыль:</span>
              {/* BD-13: colour by sign (green ≥0 / red <0), not hardcoded green. */}
              <span className={`font-semibold ${getValueColorClass(stats.totalProfit)}`}>
                {currencyFormatter.format(stats.totalProfit)}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Товаров без COGS:</span>
                <span className="font-semibold text-yellow-600">{stats.totalMissingCogs}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
