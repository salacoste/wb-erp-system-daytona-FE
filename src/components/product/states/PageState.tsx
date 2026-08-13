import { isValidElement, useId } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  CircleOff,
  Clock3,
  FileQuestion,
  Info,
  LoaderCircle,
  SearchX,
  ShieldAlert,
  TriangleAlert,
  WifiOff,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { STATE_ACTION_TARGETS } from './contracts'
import type { PageStateKind, PageStateProps } from './contracts'

const stateIcon: Record<PageStateKind, typeof Info> = {
  loading: LoaderCircle,
  refreshing: LoaderCircle,
  empty: CircleOff,
  'filtered-empty': SearchX,
  error: AlertCircle,
  offline: WifiOff,
  stale: Clock3,
  partial: TriangleAlert,
  restricted: ShieldAlert,
  'not-found': FileQuestion,
  processing: LoaderCircle,
  success: CheckCircle2,
}

const retainedStates = new Set<PageStateKind>(['refreshing', 'stale', 'partial'])

function validateRequiredEvidence(props: PageStateProps): void {
  if (props.trust.trim().length === 0) {
    throw new TypeError('Page state trust evidence must be a non-empty string.')
  }

  if (
    (props.state === 'restricted' || props.state === 'not-found') &&
    !isValidElement(props.action)
  ) {
    throw new TypeError(`${props.state} page states require a rendered action element.`)
  }
  if (props.state === 'filtered-empty' && !isValidElement(props.resetAction)) {
    throw new TypeError('Filtered-empty page states require a rendered reset action element.')
  }
  if (props.state === 'error' && !isValidElement(props.recovery)) {
    throw new TypeError('Error page states require a rendered recovery action element.')
  }
  if (props.action !== undefined && !isValidElement(props.action)) {
    throw new TypeError('Page state action must be a rendered element.')
  }
}

export function PageState(props: PageStateProps) {
  validateRequiredEvidence(props)
  const titleId = useId()
  const Heading = `h${props.headingLevel ?? 2}` as 'h1' | 'h2' | 'h3'
  const Icon = stateIcon[props.state]
  const isError = props.state === 'error'
  const isBusy = props.state === 'loading' || props.state === 'processing'
  const retained = retainedStates.has(props.state)

  return (
    <Card
      role="region"
      aria-busy={isBusy || undefined}
      aria-labelledby={titleId}
      data-state={props.state}
      className={cn(
        'min-w-0 overflow-hidden',
        isError && 'status-error border-status-error/30',
        props.className
      )}
    >
      <CardContent className="flex min-w-0 flex-col gap-4 p-6 sm:p-8">
        <div
          role={isError ? 'alert' : 'status'}
          aria-live={isError ? 'assertive' : 'polite'}
          aria-atomic="true"
          aria-labelledby={titleId}
          aria-busy={isBusy || undefined}
          className="sr-only"
        >
          {props.explanation}
        </div>
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true">
            {props.icon ?? <Icon className={cn('size-5', isBusy && 'motion-safe:animate-spin')} />}
          </div>
          <div className="min-w-0 space-y-2">
            <Heading id={titleId} className="break-words text-lg font-semibold text-foreground">
              {props.title}
            </Heading>
            <p className="break-words text-sm text-muted-foreground">{props.explanation}</p>
            {props.trust ? (
              <p className="break-words text-sm text-foreground">{props.trust}</p>
            ) : null}
            {props.context ? (
              <div className="break-words text-sm text-muted-foreground">{props.context}</div>
            ) : null}
          </div>
        </div>

        {props.state === 'filtered-empty' ? (
          <div className="space-y-3">
            <div className="break-words text-sm text-foreground">{props.scope}</div>
            <div data-slot="state-actions" className={STATE_ACTION_TARGETS}>
              {props.resetAction}
            </div>
          </div>
        ) : null}

        {props.state === 'error' ? (
          <div data-slot="state-actions" className={STATE_ACTION_TARGETS}>
            {props.recovery}
          </div>
        ) : null}

        {retained && 'limitation' in props ? (
          <div className="space-y-3">
            <div className="break-words text-sm text-status-warning">{props.limitation}</div>
            <div className="min-w-0">{props.children}</div>
          </div>
        ) : null}

        {props.action ? (
          <div data-slot="state-actions" className={STATE_ACTION_TARGETS}>
            {props.action}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
