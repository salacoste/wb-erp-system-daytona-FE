'use client'

/**
 * SlaComplianceWidget Component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays SLA compliance metrics with color-coded thresholds.
 * Reference: docs/stories/epic-40/story-40.6-fe-orders-analytics-dashboard.md#AC1
 */

import { HelpCircle, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getSlaStatusColor, getSlaStatusBgColor, getSlaStatusLabel } from '@/lib/analytics-utils'
import type { SlaMetricsResponse } from '@/types/orders-analytics'

interface SlaComplianceWidgetProps {
  data?: SlaMetricsResponse
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

/** Get status icon based on compliance percentage */
function getStatusIcon(percent: number) {
  if (percent >= 95) return <CheckCircle className="h-4 w-4 text-green-600" aria-label="Отлично" />
  if (percent >= 85)
    return <AlertTriangle className="h-4 w-4 text-yellow-600" aria-label="Внимание" />
  return <XCircle className="h-4 w-4 text-red-600" aria-label="Критично" />
}

/** Single SLA metric display */
function SlaMetricCard({
  label,
  percent,
  testIdPrefix,
}: {
  label: string
  percent: number
  testIdPrefix: string
}) {
  const colorClass = getSlaStatusColor(percent)
  const bgClass = getSlaStatusBgColor(percent)
  const statusLabel = getSlaStatusLabel(percent)

  return (
    <div
      className={cn('flex flex-col items-center rounded-lg p-4', bgClass)}
      data-testid={`${testIdPrefix}-card`}
    >
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={cn('text-3xl font-bold', colorClass)}
        data-testid={`${testIdPrefix}-value`}
        aria-label={`${label}: ${percent.toFixed(1)}%`}
      >
        {percent.toFixed(1)}%
      </span>
      <div className="mt-1 flex items-center gap-1" data-testid={`${testIdPrefix}-status-icon`}>
        {getStatusIcon(percent)}
        <span className={cn('text-xs', colorClass)}>{statusLabel}</span>
      </div>
    </div>
  )
}

/** Loading skeleton for widget */
function SlaWidgetSkeleton() {
  return (
    <div data-testid="sla-widget-skeleton" className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

/** Error state with retry */
function SlaWidgetError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <XCircle className="mb-2 h-8 w-8 text-red-500" />
      <p className="mb-2 text-sm text-gray-600">Не удалось загрузить данные SLA</p>
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
 * SlaComplianceWidget - Displays SLA compliance percentages
 */
export function SlaComplianceWidget({ data, isLoading, error, onRetry }: SlaComplianceWidgetProps) {
  return (
    <Card data-testid="sla-compliance-widget">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          SLA Соответствие
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle
                  className="h-4 w-4 cursor-help text-gray-400"
                  data-testid="sla-help-icon"
                />
              </TooltipTrigger>
              <TooltipContent size="md">
                <p>
                  SLA: 2ч / 24ч
                  <br />
                  Подтверждение: 2 часа
                  <br />
                  Выполнение: 24 часа
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <SlaWidgetSkeleton />}
        {error && !isLoading && <SlaWidgetError onRetry={onRetry} />}
        {!isLoading && !error && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SlaMetricCard
                label="Подтверждение"
                percent={data.confirmationCompliancePercent}
                testIdPrefix="confirmation-sla"
              />
              <SlaMetricCard
                label="Выполнение"
                percent={data.completionCompliancePercent}
                testIdPrefix="completion-sla"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">В ожидании: {data.pendingOrdersCount}</span>
              {data.breachedCount > 0 ? (
                <span
                  className="rounded-full bg-red-100 px-2 py-0.5 text-red-600"
                  data-testid="breached-badge"
                >
                  <span data-testid="breached-count">Нарушено: {data.breachedCount}</span>
                </span>
              ) : (
                <span className="text-gray-500">Нарушено: 0</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
