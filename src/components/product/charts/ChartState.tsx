import { cn } from '@/lib/utils'

import type { ChartActivity, ChartDataState } from './contracts'

export type ChartStateProps = {
  state: ChartDataState
  className?: string
}

export function ChartState({ state, className }: ChartStateProps) {
  if (state.kind === 'rendered') return null

  const isError = state.kind === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      data-state={state.kind}
      className={cn(
        'min-w-0 space-y-2 break-words text-sm text-muted-foreground',
        isError && 'status-error text-status-error',
        className
      )}
    >
      <div>{state.message}</div>
      {isError ? (
        <div className="[&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center [&_a]:justify-center [&_button]:min-h-11 [&_button]:min-w-11 [&_[role=button]]:inline-flex [&_[role=button]]:min-h-11 [&_[role=button]]:min-w-11 [&_[role=button]]:items-center [&_[role=button]]:justify-center">
          {state.recovery}
        </div>
      ) : null}
    </div>
  )
}

export type ChartActivityStatusProps = {
  activity?: ChartActivity
  className?: string
}

export function ChartActivityStatus({ activity, className }: ChartActivityStatusProps) {
  if (!activity) return null

  return (
    <div
      role="status"
      aria-label={activity.message}
      data-activity={activity.kind}
      className={cn('break-words text-sm text-muted-foreground', className)}
    >
      {activity.message}
    </div>
  )
}
