'use client'

import { isValidElement, useEffect, useId } from 'react'
import type { RefObject } from 'react'

import { cn } from '@/lib/utils'

import { STATE_ACTION_TARGETS } from './contracts'
import type { ContextualSplitViewProps } from './contracts'

function focusElement(element: HTMLElement | null): void {
  if (!element) return
  const needsTemporaryTabIndex = element.tabIndex < 0 && !element.hasAttribute('tabindex')
  if (needsTemporaryTabIndex) {
    element.setAttribute('tabindex', '-1')
    element.addEventListener(
      'blur',
      () => {
        if (element.getAttribute('tabindex') === '-1') element.removeAttribute('tabindex')
      },
      { once: true }
    )
  }
  element.focus({ preventScroll: true })
}

const MAX_FOCUS_RESTORE_FRAMES = 3

function isAvailableFocusTarget(element: HTMLElement | null): element is HTMLElement {
  if (!element?.isConnected || element.hasAttribute('disabled')) return false
  let current: HTMLElement | null = element
  while (current) {
    const style = window.getComputedStyle(current)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    current = current.parentElement
  }
  return true
}

function restoreFocus(
  targetRef: RefObject<HTMLElement | null>,
  remainingFrames = MAX_FOCUS_RESTORE_FRAMES
): void {
  if (isAvailableFocusTarget(targetRef.current)) {
    focusElement(targetRef.current)
    return
  }
  if (remainingFrames <= 1) return
  window.requestAnimationFrame(() => restoreFocus(targetRef, remainingFrames - 1))
}

function validateRecovery(props: ContextualSplitViewProps): void {
  if (props.detailState === 'detail-error' && !isValidElement(props.recovery)) {
    throw new TypeError('Detail error recovery must be a rendered action element.')
  }
  if (
    (props.detailState === 'stale-detail' || props.detailState === 'restricted-detail') &&
    props.recovery !== undefined &&
    !isValidElement(props.recovery)
  ) {
    throw new TypeError('Contextual detail recovery must be a rendered action element.')
  }
}

function DetailState({ props }: { props: ContextualSplitViewProps }) {
  if (
    props.detailState === 'selected' ||
    props.detailState === 'stale-detail' ||
    props.detailState === 'restricted-detail'
  ) {
    const retained = props.detailState !== 'selected'
    return (
      <div className="space-y-3">
        {retained ? (
          <div role="status" className="break-words text-sm text-status-warning">
            {props.stateMessage}
          </div>
        ) : null}
        {props.detail}
        {retained && props.recovery ? (
          <div data-slot="state-actions" className={STATE_ACTION_TARGETS}>
            {props.recovery}
          </div>
        ) : null}
      </div>
    )
  }

  const isError = props.detailState === 'detail-error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-busy={props.detailState === 'loading-detail' || undefined}
      className="space-y-3 break-words text-sm text-muted-foreground"
    >
      <p>{props.stateMessage}</p>
      {isError ? (
        <div data-slot="state-actions" className={STATE_ACTION_TARGETS}>
          {props.recovery}
        </div>
      ) : null}
    </div>
  )
}

export function ContextualSplitView(props: ContextualSplitViewProps) {
  validateRecovery(props)
  const listHeadingId = useId()
  const detailHeadingId = useId()
  const focus = props.detailState === 'no-selection' ? undefined : props.focus

  useEffect(() => {
    if (focus) focusElement(focus.detailTargetRef.current)
  }, [focus?.selectionKey])

  function closeDetail(): void {
    if (props.detailState === 'no-selection') return
    props.onClose()
    window.requestAnimationFrame(() => restoreFocus(props.focus.returnTargetRef))
  }

  return (
    <div
      data-testid="contextual-split"
      data-detail-state={props.detailState}
      className={cn(
        'grid min-w-0 gap-6 md:grid-cols-[minmax(16rem,2fr)_minmax(20rem,3fr)]',
        props.className
      )}
    >
      <section
        aria-labelledby={listHeadingId}
        data-testid="contextual-list-pane"
        className={cn('min-w-0', props.detailState !== 'no-selection' && 'hidden md:block')}
      >
        <h2 id={listHeadingId} className="sr-only">
          {props.listLabel}
        </h2>
        {props.list}
      </section>

      <section
        aria-labelledby={detailHeadingId}
        data-testid="contextual-detail-pane"
        className={cn('min-w-0', props.detailState === 'no-selection' && 'hidden md:block')}
      >
        <h2 id={detailHeadingId} className="sr-only">
          {props.detailLabel}
        </h2>
        {props.detailState !== 'no-selection' ? (
          <div className="mb-4 md:hidden">
            <div data-slot="state-actions" className={STATE_ACTION_TARGETS}>
              <button type="button" onClick={closeDetail}>
                {props.narrowBackLabel}
              </button>
            </div>
          </div>
        ) : null}
        <DetailState props={props} />
      </section>
    </div>
  )
}
