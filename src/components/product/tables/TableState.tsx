import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import type { RetainedTableStateKind, TerminalTableStateKind } from './contracts'

type BasicTerminalStateProps = {
  state: Exclude<TerminalTableStateKind, 'filtered-empty'>
  message: string
  scope?: never
  resetAction?: never
  recovery?: never
  children?: never
}

type FilteredEmptyStateProps = {
  state: 'filtered-empty'
  message: string
  scope: ReactNode
  resetAction: ReactNode
  recovery?: never
  children?: never
}

type ErrorStateProps = {
  state: 'error'
  message: string
  recovery: ReactNode
  scope?: ReactNode
  resetAction?: never
  children?: never
}

type BasicRetainedStateProps = {
  state: Exclude<RetainedTableStateKind, 'partial'>
  message: string
  children: ReactNode
  scope?: never
  missingScope?: never
  resetAction?: never
  recovery?: never
}

type PartialStateProps = {
  state: 'partial'
  message: string
  missingScope: ReactNode
  children: ReactNode
  scope?: never
  resetAction?: never
  recovery?: never
}

export type TableStateProps = (
  | BasicTerminalStateProps
  | FilteredEmptyStateProps
  | ErrorStateProps
  | BasicRetainedStateProps
  | PartialStateProps
) & { className?: string }

export function TableState(props: TableStateProps) {
  const role = props.state === 'error' ? 'alert' : 'status'

  return (
    <div className={cn('min-w-0 space-y-2', props.className)} data-table-state>
      <div
        role={role}
        data-state={props.state}
        className={cn(
          'break-words text-sm text-muted-foreground',
          props.state === 'error' && 'status-error text-status-error'
        )}
      >
        <p>{props.message}</p>
        {'scope' in props && props.scope ? (
          <div className="mt-1 text-foreground">{props.scope}</div>
        ) : null}
        {props.state === 'filtered-empty' ? <div className="mt-2">{props.resetAction}</div> : null}
        {props.state === 'partial' ? (
          <div className="mt-1 text-foreground">{props.missingScope}</div>
        ) : null}
        {props.state === 'error' ? <div className="mt-2">{props.recovery}</div> : null}
      </div>
      {'children' in props ? props.children : null}
    </div>
  )
}
