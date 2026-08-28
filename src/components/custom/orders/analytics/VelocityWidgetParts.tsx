/**
 * Velocity widget sub-components — extracted from VelocityMetricsWidget.tsx
 * Story 40.6-FE: Orders Analytics Dashboard
 */

import { RefreshCw, XCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getConfirmationTimeColor,
  getCompletionTimeColor,
  getVelocityStatusLabel,
  formatDuration,
} from '@/lib/analytics-utils'

/** Single velocity metric display */
export function VelocityMetricCard({
  label,
  minutes,
  type,
  testIdPrefix,
}: {
  label: string
  minutes: number | null
  type: 'confirm' | 'complete'
  testIdPrefix: string
}) {
  // iter-90: null avg time → "—" / "Нет данных" in neutral gray, NOT fabricated green.
  const display = minutes == null ? '—' : formatDuration(minutes)
  const statusLabel = minutes == null ? 'Нет данных' : getVelocityStatusLabel(minutes, type)
  const ariaTime = minutes == null ? 'нет данных' : formatDuration(minutes)
  const colorClass =
    minutes == null
      ? 'text-muted-foreground'
      : type === 'confirm'
        ? getConfirmationTimeColor(minutes)
        : getCompletionTimeColor(minutes)

  return (
    <div
      className="flex flex-col items-center rounded-lg bg-muted/50 p-4"
      data-testid={`${testIdPrefix}-card`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn('text-2xl font-bold', colorClass)}
        data-testid={`${testIdPrefix}-value`}
        aria-label={`Среднее время ${label.toLowerCase()}: ${ariaTime}`}
      >
        {display}
      </span>
      <span className={cn('text-xs', colorClass)}>{statusLabel}</span>
    </div>
  )
}

/** Percentiles section — hides when totalOrders===0 */
export function PercentilesSection({
  p50Confirm,
  p95Confirm,
  p50Complete,
  p95Complete,
  totalOrders,
}: {
  p50Confirm: number
  p95Confirm: number
  p50Complete: number
  p95Complete: number
  totalOrders: number
}) {
  if (totalOrders === 0) {
    return (
      <p className="pt-2 text-sm text-muted-foreground" data-testid="percentiles-empty">
        Недостаточно данных для перцентилей
      </p>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-4 pt-2 text-sm" data-testid="percentiles-content">
      <div className="space-y-1">
        <div className="text-muted-foreground">Подтверждение</div>
        <div className="text-muted-foreground">P50: {formatDuration(p50Confirm)}</div>
        <div className="text-muted-foreground">P95: {formatDuration(p95Confirm)}</div>
      </div>
      <div className="space-y-1">
        <div className="text-muted-foreground">Выполнение</div>
        <div className="text-muted-foreground">P50: {formatDuration(p50Complete)}</div>
        <div className="text-muted-foreground">P95: {formatDuration(p95Complete)}</div>
      </div>
    </div>
  )
}

/** Loading skeleton for widget */
export function VelocityWidgetSkeleton() {
  return (
    <div data-testid="velocity-widget-skeleton" className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
    </div>
  )
}

/** Error state with retry */
export function VelocityWidgetError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <XCircle className="mb-2 h-8 w-8 text-status-error" />
      <p className="mb-2 text-sm text-muted-foreground">Не удалось загрузить скорость обработки</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Повторить
        </Button>
      )}
    </div>
  )
}
