import type { ReactNode } from 'react'

export type TableNarrowStrategy =
  | {
      kind: 'horizontal-scroll'
      regionLabel: string
      minimumWidth: '40rem' | '48rem' | '64rem'
    }
  | {
      kind: 'priority-columns'
      description: string
      narrowContent: ReactNode
    }
  | { kind: 'expanded-detail'; description: string; narrowContent: ReactNode }
  | { kind: 'stacked-detail'; description: string; narrowContent: ReactNode }

export type TableNumericUnit =
  | { kind: 'currency'; code: string }
  | { kind: 'percent' }
  | { kind: 'count'; label: string }
  | { kind: 'quantity'; label: string }
  | { kind: 'unitless' }

export type TableNumericColumnContract = {
  id: string
  label: string
  alignment: 'end'
  precision: 'integer' | `${number} fraction digits` | 'caller-preserved'
  unit: TableNumericUnit
  tabularNumerals: true
  fullValueAccess: 'visible' | 'accessible-description' | 'disclosure'
}

export type TableSortContract =
  | { kind: 'none' }
  | { kind: 'caller-controlled'; direction: 'none'; activeColumnId?: never }
  | {
      kind: 'caller-controlled'
      activeColumnId: string
      direction: 'ascending' | 'descending'
    }

export type TableSelectionScope = 'page' | 'filtered-results'

export type TableSelectionContract =
  | { kind: 'none' }
  | {
      kind: 'caller-controlled'
      mode: 'single' | 'multiple'
      scope: TableSelectionScope
      accessibleNamePattern: `${string}{entityId}${string}`
    }

export type TableRowActionContract =
  | { kind: 'none' }
  | { kind: 'caller-rendered'; accessibleNamePattern: `${string}{entityId}${string}` }

export type TableConsumerContract = {
  primaryColumn: { id: string; label: string }
  numericColumns: readonly TableNumericColumnContract[]
  sorting: TableSortContract
  selection: TableSelectionContract
  rowActions: TableRowActionContract
  narrowStrategy: TableNarrowStrategy
  pagination: { kind: 'none' | 'offset' | 'cursor' }
}

export type TerminalTableStateKind = 'loading' | 'empty' | 'filtered-empty'
export type RetainedTableStateKind = 'stale' | 'partial' | 'updating'
export type TableStateKind =
  | TerminalTableStateKind
  | RetainedTableStateKind
  | 'populated'
  | 'error'
  | 'selected'
  | 'disabled'
  | 'expanded'

export type TablePresentationState =
  | { kind: 'loading' | 'empty'; message: string }
  | { kind: 'filtered-empty'; message: string; scope: ReactNode; resetAction: ReactNode }
  | { kind: 'stale' | 'updating'; message: string }
  | { kind: 'partial'; message: string; missingScope: ReactNode }
  | { kind: 'populated' | 'selected' | 'disabled' | 'expanded' }
  | { kind: 'error'; message: string; recovery: ReactNode }

export type TableSelectionSummaryModel = {
  selectedCount: number
  scope: TableSelectionScope
  scopeLabel: string
  actions?: ReactNode
}

export type VirtualizedTableContract =
  | {
      narrowStrategy: { kind: 'specialized-virtualization' }
      collectionRole: 'list'
      itemRole: 'listitem'
      headerPlacement: 'outside'
      positionFeedback: string
      endFeedback?: string
      ownership: VirtualizedTableOwnership
    }
  | {
      narrowStrategy: { kind: 'specialized-virtualization' }
      collectionRole: 'grid'
      itemRole: 'row'
      headerPlacement: 'outside'
      positionFeedback: string
      endFeedback?: string
      ownership: VirtualizedTableOwnership
    }

export type VirtualizedTableOwnership = {
  rowHeight: 'caller'
  viewportHeight: 'caller'
  overscan: 'caller'
  itemIdentity: 'caller'
  selection: 'caller'
  focus: 'caller'
}

export function entityAccessibleName(
  pattern: `${string}{entityId}${string}`,
  entityId: string
): string {
  return pattern.replace('{entityId}', entityId)
}
