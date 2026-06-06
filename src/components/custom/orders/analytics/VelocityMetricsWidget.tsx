'use client'

/**
 * VelocityMetricsWidget Component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays order processing velocity metrics with color-coded thresholds.
 * Reference: docs/stories/epic-40/story-40.6-fe-orders-analytics-dashboard.md#AC2
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, RefreshCw, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import {
  getConfirmationTimeColor,
  getCompletionTimeColor,
  getVelocityStatusLabel,
  formatDuration,
} from '@/lib/analytics-utils'
import type { VelocityMetricsResponse } from '@/types/orders-analytics'

interface VelocityMetricsWidgetProps {
  data?: VelocityMetricsResponse
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

/** Single velocity metric display */
function VelocityMetricCard({
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
  // iter-90: null avg time (backend can't compute a mean) → "—" / "Нет данных" in neutral gray,
  // NOT formatDuration(null)="0 мин" colour-coded green "Быстро" (a fabricated instant-completion
  // metric). Each `minutes == null ?` narrows the false branch to number for the helpers.
  const display = minutes == null ? '—' : formatDuration(minutes)
  const statusLabel = minutes == null ? 'Нет данных' : getVelocityStatusLabel(minutes, type)
  const ariaTime = minutes == null ? 'нет данных' : formatDuration(minutes)
  const colorClass =
    minutes == null
      ? 'text-gray-400'
      : type === 'confirm'
        ? getConfirmationTimeColor(minutes)
        : getCompletionTimeColor(minutes)

  return (
    <div
      className="flex flex-col items-center rounded-lg bg-gray-50 p-4"
      data-testid={`${testIdPrefix}-card`}
    >
      <span className="text-sm text-gray-600">{label}</span>
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

/** Percentiles section — hides when totalOrders===0 to avoid "P50: 0 мин" fabrication */
function PercentilesSection({
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
        <div className="text-gray-600">Подтверждение</div>
        <div className="text-gray-500">P50: {formatDuration(p50Confirm)}</div>
        <div className="text-gray-500">P95: {formatDuration(p95Confirm)}</div>
      </div>
      <div className="space-y-1">
        <div className="text-gray-600">Выполнение</div>
        <div className="text-gray-500">P50: {formatDuration(p50Complete)}</div>
        <div className="text-gray-500">P95: {formatDuration(p95Complete)}</div>
      </div>
    </div>
  )
}

/** Loading skeleton for widget */
function VelocityWidgetSkeleton() {
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
function VelocityWidgetError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <XCircle className="mb-2 h-8 w-8 text-red-500" />
      <p className="mb-2 text-sm text-gray-600">Не удалось загрузить скорость обработки</p>
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
 * VelocityMetricsWidget - Displays order processing velocity
 */
export function VelocityMetricsWidget({
  data,
  isLoading,
  error,
  onRetry,
}: VelocityMetricsWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card data-testid="velocity-metrics-widget">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Скорость обработки
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <VelocityWidgetSkeleton />}
        {error && !isLoading && <VelocityWidgetError onRetry={onRetry} />}
        {!isLoading && !error && data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <VelocityMetricCard
                label="Подтверждение"
                minutes={data.avgConfirmationTimeMinutes}
                type="confirm"
                testIdPrefix="confirmation-time"
              />
              <VelocityMetricCard
                label="Выполнение"
                minutes={data.avgCompletionTimeMinutes}
                type="complete"
                testIdPrefix="completion-time"
              />
            </div>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-500 hover:text-gray-700"
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronUp className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  )}
                  P50/P95 детали
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <PercentilesSection
                  p50Confirm={data.p50ConfirmationMinutes}
                  p95Confirm={data.p95ConfirmationMinutes}
                  p50Complete={data.p50CompletionMinutes}
                  p95Complete={data.p95CompletionMinutes}
                  totalOrders={data.totalOrders}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
