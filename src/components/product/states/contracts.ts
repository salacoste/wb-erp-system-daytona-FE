import type { ReactElement, ReactNode, RefObject } from 'react'

export type RetainedPageStateKind = 'refreshing' | 'stale' | 'partial'
type TerminalPageStateKind =
  'loading' | 'empty' | 'offline' | 'restricted' | 'not-found' | 'processing' | 'success'
export type PageStateKind =
  RetainedPageStateKind | TerminalPageStateKind | 'filtered-empty' | 'error'

type PageStateBase = {
  // shared visible evidence
  title: string
  explanation: string
  trust: string
  context?: ReactNode
  action?: ReactElement
  icon?: ReactNode
  headingLevel?: 1 | 2 | 3
  className?: string
}

type RetainedPageEvidenceKey = 'scope' | 'resetAction' | 'recovery' | 'limitation' | 'children'
type WithoutRetainedPageEvidence = Partial<Record<RetainedPageEvidenceKey, never>> // forbidden props

type PassivePageStateKind = Exclude<
  PageStateKind,
  RetainedPageStateKind | 'filtered-empty' | 'error' | 'restricted' | 'not-found'
>

type SimplePageStateProps = PageStateBase &
  WithoutRetainedPageEvidence & {
    state: PassivePageStateKind
  }

type RequiredActionPageStateProps = PageStateBase &
  WithoutRetainedPageEvidence & {
    state: 'restricted' | 'not-found'
    action: ReactElement
  }

type FilteredEmptyPageStateProps = PageStateBase & {
  state: 'filtered-empty'
  scope: ReactNode
  resetAction: ReactElement
} & Pick<WithoutRetainedPageEvidence, 'recovery' | 'limitation' | 'children'>

type ErrorPageStateProps = PageStateBase & {
  state: 'error'
  recovery: ReactElement
} & Omit<WithoutRetainedPageEvidence, 'recovery'>

type RetainedPageStateProps = PageStateBase & {
  state: RetainedPageStateKind
  limitation: ReactNode
  children: ReactNode
} & Pick<WithoutRetainedPageEvidence, 'scope' | 'resetAction' | 'recovery'>

export type PageStateProps =
  | SimplePageStateProps
  | RequiredActionPageStateProps
  | FilteredEmptyPageStateProps
  | ErrorPageStateProps
  | RetainedPageStateProps

type PassiveAsyncOperationPhase = 'idle' | 'partial' | 'complete' | 'failed' | 'expired'
type ActiveAsyncOperationPhase = 'validating' | 'queued' | 'running' | 'retrying'
export type AsyncOperationPhase =
  PassiveAsyncOperationPhase | 'cancellable' | 'non-cancellable' | ActiveAsyncOperationPhase

type AsyncOperationBase = {
  // caller-resolved lifecycle evidence
  operation: string
  scope: string
  message: string
  safeLeave: string
  progress?: Readonly<{ value: number; label: string }>
  action?: ReactElement
  className?: string
}

type PassiveAsyncOperationProps = AsyncOperationBase & {
  phase: PassiveAsyncOperationPhase
  cancellability: { kind: 'not-applicable' }
}

type CancellableEvidence = { kind: 'cancellable'; action: ReactElement }
type NonCancellableEvidence = { kind: 'non-cancellable'; reason: string }

type ActiveAsyncOperationProps = AsyncOperationBase & {
  phase: ActiveAsyncOperationPhase
  cancellability: CancellableEvidence | NonCancellableEvidence
}

type CancellableAsyncOperationProps = AsyncOperationBase & {
  phase: 'cancellable'
  cancellability: CancellableEvidence
}

type NonCancellableAsyncOperationProps = AsyncOperationBase & {
  phase: 'non-cancellable'
  cancellability: { kind: 'non-cancellable'; reason: string }
}

export type AsyncOperationStatusProps =
  | PassiveAsyncOperationProps
  | ActiveAsyncOperationProps
  | CancellableAsyncOperationProps
  | NonCancellableAsyncOperationProps

declare const bulkResultCountsBrand: unique symbol

type BulkResultCountKey = 'attempted' | 'succeeded' | 'failed' | 'skipped' | 'pending'
export type BulkResultCounts = Readonly<Record<BulkResultCountKey, number>> & {
  readonly [bulkResultCountsBrand]: true
}

export type BulkResultOutcome = 'pending' | 'partial' | 'complete' | 'failed'

type BulkResultBase = {
  // caller-resolved operation evidence
  operation: string
  scope: string
  counts: BulkResultCounts
  className?: string
}

type RetryEvidence = { scope: string; action: ReactElement }

type PendingBulkResultProps = BulkResultBase & {
  outcome: 'pending'
  limitation?: ReactNode
  failedItems?: ReactElement
  retry?: RetryEvidence
}

type CompleteBulkResultProps = BulkResultBase & {
  outcome: 'complete'
  limitation?: ReactNode
  failedItems?: never
  retry?: never
}

type PartialBulkResultProps = BulkResultBase & {
  outcome: 'partial'
  limitation: ReactNode
  failedItems?: ReactElement
  retry?: RetryEvidence
}

type FailedBulkResultProps = BulkResultBase & {
  outcome: 'failed'
  limitation?: ReactNode
  failedItems: ReactElement
  retry: RetryEvidence
}

export type BulkResultSummaryProps =
  PendingBulkResultProps | CompleteBulkResultProps | PartialBulkResultProps | FailedBulkResultProps

/* eslint-disable max-lines -- exact Story-owned manifest keeps its public unions in one contract */
export type ContextualDetailState =
  | 'no-selection'
  | 'loading-detail'
  | 'selected'
  | 'detail-error'
  | 'stale-detail'
  | 'restricted-detail'

export type ContextualFocusContract = {
  selectionKey: string | number
  detailTargetRef: RefObject<HTMLElement | null>
  returnTargetRef: RefObject<HTMLElement | null>
}

type ContextualSplitBase = {
  // controlled list/detail evidence
  listLabel: string
  detailLabel: string
  list: ReactNode
  focus?: ContextualFocusContract
  onClose?: () => void
  className?: string
}

type NoSelectionDetailProps = ContextualSplitBase & {
  detailState: 'no-selection'
  stateMessage: string
  detail?: never
  recovery?: never
  narrowBackAction?: never
}

type DetailTransitionBase = ContextualSplitBase & {
  focus: ContextualFocusContract
  narrowBackLabel: string
  onClose: () => void
}

type LoadingDetailProps = DetailTransitionBase & {
  detailState: 'loading-detail'
  stateMessage: string
  detail?: never
  recovery?: never
}

type SelectedDetailProps = DetailTransitionBase & {
  detailState: 'selected'
  detail: ReactNode
  stateMessage?: never
  recovery?: never
}

type ErrorDetailProps = DetailTransitionBase & {
  detailState: 'detail-error'
  stateMessage: string
  recovery: ReactElement
  detail?: never
}

type RetainedDetailProps = DetailTransitionBase & {
  detailState: 'stale-detail' | 'restricted-detail'
  stateMessage: string
  detail: ReactNode
  recovery?: ReactElement
}

export type ContextualSplitViewProps =
  | NoSelectionDetailProps
  | LoadingDetailProps
  | SelectedDetailProps
  | ErrorDetailProps
  | RetainedDetailProps

export const STATE_ACTION_TARGETS =
  '[&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:max-w-full [&_a]:items-center [&_a]:justify-center [&_a]:break-words [&_a]:whitespace-normal [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:max-w-full [&_button]:break-words [&_button]:whitespace-normal [&_[role=button]]:inline-flex [&_[role=button]]:min-h-11 [&_[role=button]]:min-w-11 [&_[role=button]]:max-w-full [&_[role=button]]:items-center [&_[role=button]]:justify-center [&_[role=button]]:break-words [&_[role=button]]:whitespace-normal'

export function createBulkResultCounts(
  counts: Omit<BulkResultCounts, typeof bulkResultCountsBrand>
): BulkResultCounts {
  const values = [counts.attempted, counts.succeeded, counts.failed, counts.skipped, counts.pending]
  if (!values.every(value => Number.isInteger(value) && value >= 0)) {
    throw new TypeError('Bulk result counts must be non-negative integers.')
  }

  const resolved = counts.succeeded + counts.failed + counts.skipped + counts.pending
  if (counts.attempted !== resolved) {
    throw new RangeError(
      'Bulk result attempted count must equal all resolved and pending outcomes.'
    )
  }

  return counts as BulkResultCounts
}
