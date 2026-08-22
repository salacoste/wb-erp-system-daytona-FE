/**
 * FBS Calculated Metrics Section — Section 4 of 5
 * Epic 96-FE Story 96.13: 3 KPI cards (turnover rate, stock coverage days, orders per product).
 *
 * Pattern 1: independent null-state — renders empty state if calculatedMetrics slice is null.
 * All 3 fields are ratios — null → '—' per CLAUDE.md anti-pattern #8.
 */

'use client'

import { TrendingUp, Calendar, BarChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FbsCalculatedMetrics } from '@/types/fbs-enhanced'
import { formatDecimal } from '@/lib/utils'

interface FbsCalculatedMetricsSectionProps {
  calculatedMetrics: FbsCalculatedMetrics | null | undefined
}

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
}

function KpiCard({ title, value, subtitle, icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

export function FbsCalculatedMetricsSection({
  calculatedMetrics,
}: FbsCalculatedMetricsSectionProps) {
  if (calculatedMetrics == null) {
    return (
      <section aria-label="Расчётные метрики" data-testid="fbs-calculated-metrics-section">
        <h2 className="text-lg font-semibold mb-3">Расчётные метрики</h2>
        <p className="text-sm text-muted-foreground">Нет расчётных метрик</p>
      </section>
    )
  }

  return (
    <section aria-label="Расчётные метрики" data-testid="fbs-calculated-metrics-section">
      <h2 className="text-lg font-semibold mb-3">Расчётные метрики</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Оборачиваемость"
          value={
            calculatedMetrics.turnoverRate == null
              ? '—'
              : formatDecimal(calculatedMetrics.turnoverRate, 2)
          }
          subtitle="раз за период"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          title="Дней покрытия остатков"
          value={
            calculatedMetrics.stockCoverageDays == null ||
            calculatedMetrics.stockCoverageDays >= 999
              ? '—'
              : formatDecimal(calculatedMetrics.stockCoverageDays, 1)
          }
          subtitle="при текущем темпе продаж"
          icon={<Calendar className="h-4 w-4" />}
        />
        <KpiCard
          title="Заказов на товар"
          value={
            calculatedMetrics.ordersPerProduct == null
              ? '—'
              : formatDecimal(calculatedMetrics.ordersPerProduct, 2)
          }
          subtitle="в среднем за период"
          icon={<BarChart className="h-4 w-4" />}
        />
      </div>
    </section>
  )
}
