'use client'

/**
 * OrganicTab — organic vs paid traffic split for Unified Product Analytics (Story 120.7-FE).
 *
 * Displays the iROAS insight card (incremental revenue / ad spend) and a per-day
 * correlation table showing organic vs ad-attributed cart breakdown with confidence.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import type { CorrelationDayItem, IncrementalRoasData } from '@/types/unified-product'
import { ProductOrganicChart } from './ProductOrganicChart'

interface OrganicTabProps {
  correlation: CorrelationDayItem[]
  iroas: IncrementalRoasData | null
}

/** iROAS interpretation → Russian label + color class. */
function iroasLabel(interp: string | null): { text: string; cls: string } {
  if (!interp) return { text: 'Нет данных', cls: 'text-muted-foreground' }
  const map: Record<string, { text: string; cls: string }> = {
    highly_effective: { text: 'Очень эффективно', cls: 'text-green-600' },
    effective: { text: 'Эффективно', cls: 'text-green-500' },
    marginal: { text: 'На грани', cls: 'text-yellow-600' },
    ineffective: { text: 'Неэффективно', cls: 'text-red-500' },
  }
  return map[interp] ?? { text: interp, cls: 'text-muted-foreground' }
}

export function OrganicTab({ correlation, iroas }: OrganicTabProps) {
  const verdict = iroasLabel(iroas?.interpretation ?? null)

  return (
    <div className="space-y-6">
      {/* iROAS insight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Инкрементальный ROAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {iroas?.iROAS != null ? formatNumber(iroas.iROAS) : '—'}
            </p>
            <p className={`text-xs mt-1 font-medium ${verdict.cls}`}>{verdict.text}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Инкрементальная выручка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {iroas ? formatCurrency(iroas.incrementalRevenue) : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Выручка за вычетом органики</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Каннибализация органики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {iroas?.organicCannibalizationPct != null
                ? formatPercentage(iroas.organicCannibalizationPct)
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">% заказов был органическим</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Рекламные заказы vs Органика
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {iroas
                ? `${formatNumber(iroas.totalOrders - iroas.estimatedOrganicOrders)} / ${formatNumber(iroas.estimatedOrganicOrders)}`
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Реклама / Органика</p>
          </CardContent>
        </Card>
      </div>

      {/* Stacked bar chart: organic vs ad cart */}
      {correlation.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Добавления в корзину</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductOrganicChart correlation={correlation} />
          </CardContent>
        </Card>
      )}

      {/* Per-day correlation table */}
      {correlation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Разбивка по дням</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Дата</th>
                  <th className="pb-2 font-medium text-right">Рекл. заказы</th>
                  <th className="pb-2 font-medium text-right">Орг. корзина</th>
                  <th className="pb-2 font-medium text-right">Рекл. корзина</th>
                  <th className="pb-2 font-medium text-right">Достоверность</th>
                </tr>
              </thead>
              <tbody>
                {correlation.map(day => (
                  <tr key={day.date} className="border-b last:border-0">
                    <td className="py-2">{day.date}</td>
                    <td className="py-2 text-right">{formatNumber(day.adOrders)}</td>
                    <td className="py-2 text-right">{formatNumber(day.organicCart)}</td>
                    <td className="py-2 text-right">
                      {day.estimatedAdCart != null ? formatNumber(day.estimatedAdCart) : '—'}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={
                          day.confidence === 'high'
                            ? 'text-green-600'
                            : day.confidence === 'medium'
                              ? 'text-yellow-600'
                              : 'text-muted-foreground'
                        }
                      >
                        {day.confidence === 'high'
                          ? 'Высокая'
                          : day.confidence === 'medium'
                            ? 'Средняя'
                            : 'Низкая'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {correlation.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет данных по органическому трафику за выбранный период
          </CardContent>
        </Card>
      )}
    </div>
  )
}
