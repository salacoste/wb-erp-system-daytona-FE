/**
 * Overview Tab Component
 * Story 51.8-FE: FBS Analytics Page (Tab Navigation & Integration)
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Summary cards, trends chart, and quick insights.
 * Integrates FbsTrendsChart from Story 51.4-FE.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ShoppingCart, TrendingUp, DollarSign, XCircle } from 'lucide-react'
import { useFbsTrends, calculateDaysDiff, getSmartAggregation } from '@/hooks/useFbsAnalytics'
import { FbsTrendsChart } from '@/components/custom/analytics/FbsTrendsChart'
import { formatNumber, formatPercentValue } from '@/lib/fbs-analytics-utils'

interface OverviewTabProps {
  from: string
  to: string
}

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  isLoading?: boolean
}

function SummaryCard({ title, value, subtitle, icon, isLoading }: SummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OverviewTab({ from, to }: OverviewTabProps) {
  const daysDiff = from && to ? calculateDaysDiff(from, to) : 30
  const aggregation = getSmartAggregation(daysDiff)

  const { data, isLoading, error } = useFbsTrends(
    { from, to, aggregation },
    { enabled: !!from && !!to }
  )

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Не удалось загрузить данные. Попробуйте обновить страницу или выбрать другой период.
        </AlertDescription>
      </Alert>
    )
  }

  const summary = data?.summary

  return (
    <div className="space-y-6 mt-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Всего заказов"
          value={summary ? formatNumber(summary.totalOrders) : '—'}
          subtitle={`за ${daysDiff} дн.`}
          icon={<ShoppingCart className="h-5 w-5 text-primary" />}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Выручка"
          value={summary ? `${formatNumber(summary.totalRevenue)} ₽` : '—'}
          subtitle="за период"
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Средний заказ/день"
          value={summary ? formatNumber(summary.avgDailyOrders) : '—'}
          subtitle="в среднем"
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Отмены"
          value={summary ? formatPercentValue(summary.cancellationRate) : '—'}
          subtitle="процент отмен"
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          isLoading={isLoading}
        />
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Динамика заказов</CardTitle>
        </CardHeader>
        <CardContent>
          {from && to ? (
            <FbsTrendsChart from={from} to={to} aggregation={aggregation} height={350} />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              Выберите период для отображения графика
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
