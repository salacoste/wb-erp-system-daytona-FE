import type { MutableRefObject, ReactNode, RefObject } from 'react'

export type FilterToolbarState =
  'default' | 'applied' | 'dependency-loading' | 'updating' | 'invalid' | 'empty' | 'disabled'

export type FilterScopeValue = Exclude<ReactNode, null | undefined | boolean>

type FocusTargetRef = RefObject<HTMLElement | null> | MutableRefObject<HTMLElement | null>

interface FilterToolbarBaseProps {
  label?: string
  primaryControls: ReactNode
  secondaryControls?: ReactNode
  appliedSummary?: ReactNode
  resultCount?: number
  resultLabel?: string
  stateLabel?: string
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  expandLabel?: string
  collapseLabel?: string
  resetLabel?: string
  resetFocusRef?: FocusTargetRef
  actions?: ReactNode
  className?: string
}

type PassiveFilterToolbarProps = FilterToolbarBaseProps & {
  state?: Exclude<FilterToolbarState, 'applied' | 'empty'>
  onReset?: () => void
  resetScope?: string
}

type AppliedFilterToolbarProps = FilterToolbarBaseProps & {
  state: 'applied'
  appliedSummary: FilterScopeValue
  onReset: () => void
  resetScope: string
}

type EmptyFilterToolbarProps = FilterToolbarBaseProps & {
  state: 'empty'
  appliedSummary: FilterScopeValue
  resultCount: 0
  onReset: () => void
  resetScope: string
}

export type FilterToolbarProps =
  PassiveFilterToolbarProps | AppliedFilterToolbarProps | EmptyFilterToolbarProps
