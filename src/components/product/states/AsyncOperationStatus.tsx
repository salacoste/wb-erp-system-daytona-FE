import { isValidElement, useId } from 'react'
import { CheckCircle2, Circle, Clock3, RotateCw, TriangleAlert, XCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import { STATE_ACTION_TARGETS } from './contracts'
import type { AsyncOperationPhase, AsyncOperationStatusProps } from './contracts'

const phasePresentation: Record<
  AsyncOperationPhase,
  { label: string; Icon: typeof Circle; className: string }
> = {
  idle: { label: 'Ожидает запуска', Icon: Circle, className: 'status-neutral' },
  validating: { label: 'Проверка', Icon: Clock3, className: 'status-pending' },
  queued: { label: 'В очереди', Icon: Clock3, className: 'status-pending' },
  running: { label: 'Выполняется', Icon: RotateCw, className: 'status-information' },
  cancellable: {
    label: 'Выполняется, отмена доступна',
    Icon: RotateCw,
    className: 'status-information',
  },
  'non-cancellable': {
    label: 'Выполняется, отмена недоступна',
    Icon: RotateCw,
    className: 'status-warning',
  },
  partial: { label: 'Завершено частично', Icon: TriangleAlert, className: 'status-warning' },
  complete: { label: 'Завершено', Icon: CheckCircle2, className: 'status-success' },
  failed: { label: 'Не выполнено', Icon: XCircle, className: 'status-error' },
  retrying: { label: 'Повторная попытка', Icon: RotateCw, className: 'status-pending' },
  expired: { label: 'Результат недоступен', Icon: Clock3, className: 'status-warning' },
}

function validateProgress(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError('Operation progress must be a finite percentage from 0 to 100.')
  }
}

const activePhases = new Set<AsyncOperationPhase>(['validating', 'queued', 'running', 'retrying'])

function validateCancellability(props: AsyncOperationStatusProps): void {
  if (activePhases.has(props.phase) && props.cancellability.kind === 'not-applicable') {
    throw new TypeError('Active operation phases require explicit cancellability evidence.')
  }
  if (props.cancellability.kind === 'cancellable' && !isValidElement(props.cancellability.action)) {
    throw new TypeError('Operation cancellation action must be a rendered element.')
  }
  if (
    props.cancellability.kind === 'non-cancellable' &&
    props.cancellability.reason.trim().length === 0
  ) {
    throw new TypeError('Non-cancellable operation evidence requires a non-empty reason.')
  }
  if (props.action !== undefined && !isValidElement(props.action)) {
    throw new TypeError('Operation action must be a rendered element.')
  }
}

export function AsyncOperationStatus(props: AsyncOperationStatusProps) {
  const titleId = useId()
  const presentation = phasePresentation[props.phase]
  const isFailed = props.phase === 'failed'
  if (props.progress) validateProgress(props.progress.value)
  validateCancellability(props)

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      data-phase={props.phase}
      className={cn('min-w-0 overflow-hidden', presentation.className, props.className)}
    >
      <CardContent className="min-w-0 space-y-4 p-6">
        <div
          role={isFailed ? 'alert' : 'status'}
          aria-live={isFailed ? 'assertive' : 'polite'}
          aria-atomic="true"
          className="sr-only"
        >
          {`${props.operation}: ${presentation.label}`}
        </div>
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 id={titleId} className="break-words font-semibold text-foreground">
              {props.operation}
            </h2>
            <p className="break-words text-sm text-muted-foreground">{props.scope}</p>
          </div>
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium">
            <presentation.Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="break-words">{presentation.label}</span>
          </span>
        </div>

        <p className="break-words text-sm text-foreground">{props.message}</p>

        {props.progress ? (
          <div className="space-y-2">
            <Progress
              value={props.progress.value}
              aria-label={props.progress.label}
              aria-valuetext={props.progress.label}
            />
            <p className="break-words text-sm tabular-nums text-muted-foreground">
              {props.progress.label}
            </p>
          </div>
        ) : null}

        {props.cancellability.kind === 'cancellable' ? (
          <div data-slot="state-actions" className={STATE_ACTION_TARGETS}>
            {props.cancellability.action}
          </div>
        ) : null}
        {props.cancellability.kind === 'non-cancellable' ? (
          <p className="break-words text-sm text-status-warning">{props.cancellability.reason}</p>
        ) : null}

        <p className="break-words text-sm text-muted-foreground">{props.safeLeave}</p>
        {props.action ? (
          <div data-slot="state-actions" className={STATE_ACTION_TARGETS}>
            {props.action}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
