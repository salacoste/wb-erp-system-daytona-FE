import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import type {
  TablePresentationState,
  TableSelectionSummaryModel,
  VirtualizedTableContract,
} from './contracts'

type VirtualizedTableFrameSharedProps = {
  label: string
  contract: VirtualizedTableContract
  header: ReactNode
  endReached?: boolean
  selectionSummary?: TableSelectionSummaryModel
  className?: string
}

type VirtualizedTerminalProps = VirtualizedTableFrameSharedProps & {
  state: Extract<TablePresentationState, { kind: 'loading' | 'empty' | 'filtered-empty' | 'error' }>
  children?: never
}

type VirtualizedDataProps = VirtualizedTableFrameSharedProps & {
  state: Exclude<TablePresentationState, { kind: 'loading' | 'empty' | 'filtered-empty' | 'error' }>
  children: ReactNode
}

export type VirtualizedTableFrameProps = VirtualizedTerminalProps | VirtualizedDataProps

export function VirtualizedTableFrame({
  label,
  contract,
  state,
  header,
  children,
  endReached = false,
  selectionSummary,
  className,
}: VirtualizedTableFrameProps) {
  const updating = state.kind === 'updating'
  const retainsData = !['loading', 'empty', 'filtered-empty', 'error'].includes(state.kind)

  return (
    <section
      aria-label={label}
      aria-busy={updating || undefined}
      data-state={state.kind}
      data-narrow-strategy={contract.narrowStrategy.kind}
      data-collection-role={contract.collectionRole}
      data-item-role={contract.itemRole}
      className={cn('min-w-0 space-y-2', className)}
    >
      <div data-virtualized-header>{header}</div>
      {'message' in state ? (
        <div
          role={state.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'break-words text-sm text-muted-foreground',
            state.kind === 'error' && 'status-error text-status-error'
          )}
        >
          {state.message}
          {state.kind === 'filtered-empty' ? (
            <>
              <div className="mt-1 text-foreground">{state.scope}</div>
              <div className="mt-2">{state.resetAction}</div>
            </>
          ) : null}
          {state.kind === 'partial' ? (
            <div className="mt-1 text-foreground">{state.missingScope}</div>
          ) : null}
          {state.kind === 'error' ? <div className="mt-2">{state.recovery}</div> : null}
        </div>
      ) : null}
      {children}
      {retainsData ? (
        <div className="flex min-w-0 flex-wrap gap-2 text-sm text-muted-foreground">
          <span>{contract.positionFeedback}</span>
          {endReached && contract.endFeedback ? <span>{contract.endFeedback}</span> : null}
        </div>
      ) : null}
      {selectionSummary ? (
        <div
          className="flex min-w-0 flex-wrap items-center gap-2 text-sm"
          data-selection-scope={selectionSummary.scope}
        >
          <span>{`Выбрано: ${selectionSummary.selectedCount} — ${selectionSummary.scopeLabel}`}</span>
          {selectionSummary.actions}
        </div>
      ) : null}
    </section>
  )
}
