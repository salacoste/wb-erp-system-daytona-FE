'use client'

/**
 * CollectingProgressTracker — full collecting-state UI with progress bar,
 * missing requirements list, COGS coverage warning, estimated activation,
 * and top SKUs table from /v1/ai/trends.
 *
 * Story 108.4-FE (expanded from 108.3 placeholder).
 */
import { Brain, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { TopSkusTable } from './TopSkusTable'
import { formatDate } from '@/lib/utils'
import type { AiStatusResponse } from '@/types/ai/status'

interface Props {
  status: AiStatusResponse
}

export function CollectingProgressTracker({ status }: Props) {
  const {
    weeksCollected,
    weeksRequired,
    progressPct,
    missingRequirements,
    estimatedActivationDate,
    cogsCoveragePct,
    skuCount,
    orderCount,
  } = status

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-purple-600 shrink-0" />
            <h2 className="text-lg font-semibold">Сбор данных для AI</h2>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <Progress value={progressPct ?? 0} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progressPct != null ? `${progressPct}%` : '—'} готовности
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 text-sm">
            <span>
              <span className="font-medium">Собрано:</span> {weeksCollected} из {weeksRequired}{' '}
              недель
            </span>
            <span>
              <span className="font-medium">SKU отслеживается:</span> {skuCount}
            </span>
            <span>
              <span className="font-medium">Заказов:</span> {orderCount}
            </span>
          </div>

          {/* Missing requirements */}
          {missingRequirements.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Все требования выполнены</span>
            </div>
          ) : (
            <ul className="space-y-1">
              {missingRequirements.map(req => (
                <li key={req} className="flex items-start gap-2 text-sm text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          )}

          {/* COGS coverage warning */}
          {cogsCoveragePct != null && cogsCoveragePct < 90 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Покрытие COGS: {cogsCoveragePct}% (нужно ≥90%)</AlertDescription>
            </Alert>
          )}

          {/* Estimated activation */}
          <p className="text-sm text-muted-foreground">
            {estimatedActivationDate != null
              ? `Ожидаемая активация: ${formatDate(estimatedActivationDate)}`
              : 'Ожидаемая активация: ещё рассчитывается'}
          </p>
        </CardContent>
      </Card>

      {/* Top SKUs section */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="text-base font-semibold">Что вы можете делать сейчас</h3>
          <TopSkusTable />
        </CardContent>
      </Card>
    </div>
  )
}
