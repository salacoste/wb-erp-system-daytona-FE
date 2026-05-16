'use client'

/**
 * CollectingProgressTracker — full collecting-state UI with progress bar,
 * missing requirements list, COGS coverage warning, estimated activation,
 * and top SKUs table from /v1/ai/trends.
 *
 * Story 108.4-FE (expanded from 108.3 placeholder).
 * Polish F-1/F-2 fix: defensive weeksRequired display + actionable "what now" section.
 */
import { Brain, AlertTriangle, CheckCircle, Bell, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { TopSkusTable } from './TopSkusTable'
import { formatDate } from '@/lib/utils'
import { pluralize, WEEK_FORMS } from '@/lib/russian-plural'
import type { AiStatusResponse } from '@/types/ai/status'

interface Props {
  status: AiStatusResponse
}

/**
 * Renders the "X из Y недель" or "X недель/неделя/недели" string defensively.
 * When weeksRequired is null (backend omits the field), shows collected count only.
 * See docs/request-backend/174-ai-status-weeks-required-missing.md
 */
function formatWeeksProgress(weeksCollected: number, weeksRequired: number | null): string {
  if (weeksRequired !== null && weeksRequired > 0) {
    return `${weeksCollected} из ${weeksRequired} недель`
  }
  // weeksRequired absent or 0: show collected count with proper Russian plural form only
  return `${weeksCollected} ${pluralize(WEEK_FORMS, weeksCollected)}`
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
            {/* DISPLAY-GUARD (CLAUDE-PATTERNS.md § Anti-Pattern #8 Exceptions):
                Progress component requires numeric value prop; null rendered as
                — in adjacent text below. Per Story 105.1-FE ESLint rule, progressPct
                doesn't match the regex (camelCase, not _pct suffix), but inline
                comment documents the rationale for future readers. */}
            <Progress value={progressPct ?? 0} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progressPct != null ? `${progressPct}%` : '—'} готовности
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 text-sm">
            <span>
              <span className="font-medium">Собрано:</span>{' '}
              {formatWeeksProgress(weeksCollected, weeksRequired)}
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
          {/* F-2 fix: authored actionable items while AI data is accumulating. */}
          <ul className="space-y-3 mb-2">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
              <span>Загрузите COGS для топ-SKU — увеличьте покрытие до ≥90% для активации AI</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Bell aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
              <span>Подключите Telegram-уведомления — получайте сводки прогнозов</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <TrendingUp aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
              <span>
                Перейдите в{' '}
                <a href="/analytics/unit-economics" className="underline hover:no-underline">
                  Юнит-экономику
                </a>{' '}
                для исторического анализа прибыльности
              </span>
            </li>
          </ul>
          {/* Spec line 114 mandates "Топ-5 SKU по объёму" sub-heading (in addition
              to the wrapper heading above). 2-pass review fix. */}
          <h4 className="text-sm font-medium text-muted-foreground">Топ-5 SKU по объёму</h4>
          <TopSkusTable />
        </CardContent>
      </Card>
    </div>
  )
}
