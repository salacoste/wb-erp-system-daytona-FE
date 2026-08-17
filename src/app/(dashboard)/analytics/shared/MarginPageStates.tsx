/**
 * Margin Analytics — Shared loading & error states
 * Extracted from category/page.tsx & brand/page.tsx for file-size compliance (Epic 134-FE)
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, CalendarRange, GitCompare } from 'lucide-react'
import { formatPeriodLabel } from '@/components/custom/DateRangePicker'

export function MarginPageLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export function MarginPageError({
  title,
  error,
  onRetry,
}: {
  title: string
  error: unknown
  onRetry: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      </div>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки данных'}</span>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Повторить
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/** Period indicator banner (shown when date range mode is active) */
export function MarginPeriodIndicator({
  weekStart,
  weekEnd,
  isRangeMode,
}: {
  weekStart: string
  weekEnd: string
  isRangeMode: boolean
}) {
  if (!isRangeMode) return null
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-status-information/10 px-4 py-2 rounded-lg">
      <CalendarRange className="h-4 w-4 text-status-information" />
      <span>
        Период: <strong>{formatPeriodLabel(weekStart, weekEnd)}</strong>
      </span>
    </div>
  )
}

/** Comparison indicator banner (shown when comparison is active) */
export function MarginComparisonIndicator({
  weekStart,
  weekEnd,
  compareStart,
  compareEnd,
}: {
  weekStart: string
  weekEnd: string
  compareStart: string
  compareEnd: string
}) {
  if (!compareStart || !compareEnd) return null
  return (
    <div className="flex items-center gap-2 text-sm text-status-information-foreground bg-status-information px-4 py-2 rounded-lg">
      <GitCompare className="h-4 w-4" />
      <span>
        Сравнение: <strong>{formatPeriodLabel(weekStart, weekEnd)}</strong>
        {' vs '}
        <strong>{formatPeriodLabel(compareStart, compareEnd)}</strong>
      </span>
    </div>
  )
}
