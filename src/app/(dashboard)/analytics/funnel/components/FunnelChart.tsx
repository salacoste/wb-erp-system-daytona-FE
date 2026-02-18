/**
 * Funnel Time Series Chart
 * Epic 68: Daily funnel metrics chart (lazy-loaded via showChart toggle)
 */

'use client'

import { useFunnelTimeSeries } from '@/hooks/use-funnel-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { FunnelDayItem } from '@/types/analytics-epics-68-71'

interface FunnelChartProps {
  from: string
  to: string
}

export function FunnelChart({ from, to }: FunnelChartProps) {
  const { data, isLoading, isError } = useFunnelTimeSeries(from, to)

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить график</AlertDescription>
      </Alert>
    )
  }

  const days = (data?.items ?? []) as FunnelDayItem[]

  if (days.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Нет данных для графика за выбранный период</AlertDescription>
      </Alert>
    )
  }

  // Find max values for scaling
  const maxViews = Math.max(...days.map(d => d.openCardCount), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Динамика воронки по дням</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Legend */}
          <div className="flex gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-blue-400" /> Просмотры
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-orange-400" /> Заказы
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-green-400" /> Выкупы
            </span>
          </div>

          {/* Simple bar chart */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {days.map(day => (
              <div key={day.date} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-muted-foreground shrink-0">
                  {formatShortDate(day.date)}
                </span>
                <div className="flex-1 flex gap-0.5 h-5">
                  <Bar value={day.openCardCount} max={maxViews} color="bg-blue-400" />
                  <Bar value={day.ordersCount} max={maxViews} color="bg-orange-400" />
                  <Bar value={day.buyoutCount} max={maxViews} color="bg-green-400" />
                </div>
                <span className="w-12 text-right text-muted-foreground">
                  {day.totalConversion.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = max > 0 ? (value / max) * 100 : 0
  return (
    <div
      className={`${color} rounded-sm h-full`}
      style={{ width: `${Math.max(width, 0.5)}%` }}
      title={value.toLocaleString('ru-RU')}
    />
  )
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}
