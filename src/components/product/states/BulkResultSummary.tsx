import { isValidElement, useId } from 'react'
import { CheckCircle2, Clock3, TriangleAlert, XCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { BulkResultOutcome, BulkResultSummaryProps } from './contracts'
import { createBulkResultCounts, STATE_ACTION_TARGETS } from './contracts'

const outcomePresentation: Record<
  BulkResultOutcome,
  { label: string; Icon: typeof Clock3; className: string }
> = {
  pending: { label: 'Есть незавершённые элементы', Icon: Clock3, className: 'status-pending' },
  partial: { label: 'Завершено частично', Icon: TriangleAlert, className: 'status-warning' },
  complete: { label: 'Все элементы обработаны', Icon: CheckCircle2, className: 'status-success' },
  failed: { label: 'Операция не выполнена', Icon: XCircle, className: 'status-error' },
}

const countLabels = [
  ['attempted', 'Попыток'],
  ['succeeded', 'Успешно'],
  ['failed', 'Ошибок'],
  ['skipped', 'Пропущено'],
  ['pending', 'Ожидает'],
] as const

function validateOutcome(props: BulkResultSummaryProps): void {
  const { counts, outcome } = props
  const hasPending = counts.pending > 0
  const hasFailed = counts.failed > 0
  const hasSkipped = counts.skipped > 0
  const allAttemptedFailed = counts.failed === counts.attempted
  const hasMixedOutcomeEvidence =
    (hasFailed || hasSkipped) && (counts.succeeded > 0 || hasPending || (hasFailed && hasSkipped))

  if (outcome === 'complete' && (hasPending || hasFailed)) {
    throw new TypeError('Complete bulk results cannot contain failed or pending outcomes.')
  }
  if (outcome === 'pending' && !hasPending) {
    throw new TypeError('Pending bulk results require a positive pending count.')
  }
  if (outcome === 'failed' && !allAttemptedFailed) {
    throw new TypeError('Failed bulk results require every attempted item to fail.')
  }
  if (outcome === 'partial' && !hasMixedOutcomeEvidence) {
    throw new TypeError('Partial bulk results require both limited and retained outcome evidence.')
  }

  const hasFailureEvidence = 'failedItems' in props && Boolean(props.failedItems)
  const hasRetryEvidence = 'retry' in props && Boolean(props.retry)
  if (counts.failed > 0 && !hasFailureEvidence) {
    throw new TypeError('Failed bulk results require caller-owned failed-item evidence.')
  }
  if (counts.failed > 0 && !hasRetryEvidence) {
    throw new TypeError('Failed bulk results require an explicit retry scope and action.')
  }
  if ('retry' in props && props.retry && !isValidElement(props.retry.action)) {
    throw new TypeError('Bulk retry action must be a rendered element.')
  }
  if (counts.failed === 0 && (hasFailureEvidence || hasRetryEvidence)) {
    throw new TypeError('Retry and failed-item evidence require a positive failed count.')
  }
}

export function BulkResultSummary(props: BulkResultSummaryProps) {
  const titleId = useId()
  const presentation = outcomePresentation[props.outcome]
  createBulkResultCounts(props.counts)
  validateOutcome(props)

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      data-outcome={props.outcome}
      className={cn('min-w-0 overflow-hidden', presentation.className, props.className)}
    >
      <CardContent className="min-w-0 space-y-5 p-6">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 id={titleId} className="break-words font-semibold text-foreground">
              {`Результат: ${props.operation}`}
            </h2>
            <p className="break-words text-sm text-muted-foreground">{props.scope}</p>
          </div>
          <span
            role="status"
            className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium"
          >
            <presentation.Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="break-words">{presentation.label}</span>
          </span>
        </div>

        <dl className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-5">
          {countLabels.map(([key, label]) => (
            <div key={key} className="min-w-0 rounded-lg border p-3">
              <dt className="break-words text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {props.counts[key]}
              </dd>
            </div>
          ))}
        </dl>

        {'limitation' in props && props.limitation ? (
          <div className="break-words text-sm text-status-warning">{props.limitation}</div>
        ) : null}
        {'failedItems' in props && props.failedItems ? (
          <div className="min-w-0">{props.failedItems}</div>
        ) : null}
        {'retry' in props && props.retry ? (
          <div className="space-y-2">
            <p className="break-words text-sm text-foreground">{props.retry.scope}</p>
            <div data-slot="state-actions" className={STATE_ACTION_TARGETS}>
              {props.retry.action}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
