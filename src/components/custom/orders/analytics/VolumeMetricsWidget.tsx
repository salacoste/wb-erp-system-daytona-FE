'use client'

/**
 * VolumeMetricsWidget Component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays order volume metrics with hourly breakdown sparkline.
 * Reference: docs/stories/epic-40/story-40.6-fe-orders-analytics-dashboard.md
 */

import { BarChart3, RefreshCw, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VolumeMetricsResponse } from '@/types/orders-analytics'

interface VolumeMetricsWidgetProps {
  data?: VolumeMetricsResponse
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

/** Sparkline chart for hourly trend */
function HourlySparkline({
  data,
  peakHours,
}: {
  data: { hour: number; count: number }[]
  peakHours: number[]
}) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const peakSet = new Set(peakHours)

  return (
    <div
      className="flex h-12 items-end gap-0.5"
      data-testid="hourly-sparkline"
      aria-label="Почасовое распределение заказов"
    >
      {data.map(({ hour, count }) => {
        const heightPercent = (count / maxCount) * 100
        const isPeak = peakSet.has(hour)

        return (
          <div
            key={hour}
            className={cn(
              'w-full min-w-[4px] rounded-t transition-colors',
              isPeak ? 'bg-primary' : 'bg-gray-300'
            )}
            style={{ height: `${Math.max(heightPercent, 4)}%` }}
            title={`${hour}:00 - ${count} заказов`}
            aria-label={`${hour}:00 - ${count} заказов${isPeak ? ' (пиковый час)' : ''}`}
          />
        )
      })}
    </div>
  )
}

/** Peak hours display */
function PeakHoursDisplay({ peakHours }: { peakHours: number[] }) {
  if (peakHours.length === 0) return null

  const formatted = peakHours.map(h => `${h}:00`).join(', ')

  return (
    <div className="text-xs text-gray-500">
      Пиковые часы: <span className="font-medium text-gray-700">{formatted}</span>
    </div>
  )
}

/** Loading skeleton for widget */
function VolumeWidgetSkeleton() {
  return (
    <div data-testid="volume-widget-skeleton" className="space-y-3">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

/** Error state with retry */
function VolumeWidgetError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <XCircle className="mb-2 h-8 w-8 text-red-500" />
      <p className="mb-2 text-sm text-gray-600">Не удалось загрузить объём</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Повторить
        </Button>
      )}
    </div>
  )
}

/**
 * VolumeMetricsWidget - Displays order volume with sparkline
 */
export function VolumeMetricsWidget({ data, isLoading, error, onRetry }: VolumeMetricsWidgetProps) {
  return (
    <Card data-testid="volume-metrics-widget">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Объём заказов
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <VolumeWidgetSkeleton />}
        {error && !isLoading && <VolumeWidgetError onRetry={onRetry} />}
        {!isLoading && !error && data && (
          <div className="space-y-3">
            <div className="text-2xl font-bold" data-testid="total-orders-value">
              {data.totalOrders.toLocaleString('ru-RU')}
              <span className="ml-1 text-sm font-normal text-gray-500">заказов</span>
            </div>

            {data.hourlyTrend.length > 0 && (
              <HourlySparkline data={data.hourlyTrend} peakHours={data.peakHours} />
            )}

            <PeakHoursDisplay peakHours={data.peakHours} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
