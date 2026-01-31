/**
 * Storage Trends Widget
 * Story 63.6-FE: Storage Trends Chart Enhancement (Dashboard)
 * Epic 63: Dashboard Main Page (Frontend)
 *
 * Dashboard widget showing storage cost trends over time:
 * - Area chart with purple gradient
 * - Min/Max/Avg summary stats
 * - Trend badge (inverted: increase = bad for costs)
 *
 * @see docs/stories/epic-63/story-63.6-fe-storage-trends-chart.md
 */

'use client'

import { TrendingUp, BarChart3, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStorageTrends } from '@/hooks/useStorageAnalytics'
import { cn } from '@/lib/utils'
import { TrendBadge } from './TrendBadge'
import { SummaryStats } from './SummaryStats'
import { StorageTrendsChart } from './StorageTrendsChart'

export interface StorageTrendsWidgetProps {
  /** Start week (ISO format, e.g., "2025-W44") */
  weekStart: string
  /** End week (ISO format) */
  weekEnd: string
  /** Chart height in pixels (default: 250) */
  height?: number
  /** Show summary statistics (default: true) */
  showSummary?: boolean
  /** Additional CSS classes */
  className?: string
}

export function StorageTrendsWidget({
  weekStart,
  weekEnd,
  height = 250,
  showSummary = true,
  className,
}: StorageTrendsWidgetProps) {
  const { data, isLoading, isError, error, refetch } = useStorageTrends(weekStart, weekEnd)

  const summary = data?.summary?.storage_cost

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <TrendingUp className="h-5 w-5 text-[#7C4DFF]" />
          Динамика расходов на хранение
        </CardTitle>
        {summary && <TrendBadge trend={summary.trend} invertColors />}
      </CardHeader>
      <CardContent>
        {showSummary && summary && (
          <div className="mb-4 pb-3 border-b">
            <SummaryStats min={summary.min} max={summary.max} avg={summary.avg} />
          </div>
        )}
        {isLoading && <ChartLoadingSkeleton height={height} />}
        {isError && <ChartErrorState error={error} onRetry={refetch} height={height} />}
        {!isLoading && !isError && !data?.has_data && <ChartEmptyState height={height} />}
        {!isLoading && !isError && data?.has_data && (
          <StorageTrendsChart data={data.data} height={height} />
        )}
      </CardContent>
    </Card>
  )
}

function ChartLoadingSkeleton({ height }: { height: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="w-full" style={{ height }} />
    </div>
  )
}

function ChartEmptyState({ height }: { height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-muted-foreground border rounded-lg bg-muted/20"
      style={{ height }}
    >
      <BarChart3 className="h-10 w-10 mb-2" />
      <p className="text-sm">Нет данных за выбранный период</p>
    </div>
  )
}

function ChartErrorState({
  error,
  onRetry,
  height,
}: {
  error: Error | null
  onRetry: () => void
  height: number
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center border rounded-lg"
      style={{ height }}
    >
      <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
      <p className="text-sm text-muted-foreground mb-3">
        {error?.message || 'Ошибка загрузки данных'}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  )
}
