'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

import type { FilterToolbarProps } from './FilterToolbar.types'

const STATE_LABELS = {
  default: 'Фильтры готовы',
  applied: 'Фильтры применены',
  'dependency-loading': 'Загрузка зависимых фильтров',
  updating: 'Результаты обновляются',
  invalid: 'Комбинация фильтров недоступна',
  empty: 'По выбранным фильтрам ничего не найдено',
  disabled: 'Фильтры временно недоступны',
} as const

function hasVisibleScope(value: ReactNode): boolean {
  return (
    value !== undefined &&
    value !== null &&
    typeof value !== 'boolean' &&
    (typeof value !== 'string' || value.trim() !== '')
  )
}

function canReceiveFocus(target: HTMLElement): boolean {
  if (!target.isConnected || target.matches(':disabled, [aria-disabled="true"], [hidden]'))
    return false
  const style = window.getComputedStyle(target)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

/** Route-free presentation; callers retain filter data and every domain side effect. */
export function FilterToolbar({
  label = 'Фильтры данных',
  primaryControls,
  secondaryControls,
  appliedSummary,
  resultCount,
  resultLabel = 'Результатов',
  state = 'default',
  stateLabel,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  expandLabel = 'Показать дополнительные фильтры',
  collapseLabel = 'Скрыть дополнительные фильтры',
  onReset,
  resetLabel = 'Сбросить фильтры',
  resetScope = 'Все применённые фильтры',
  resetFocusRef,
  actions,
  className,
}: FilterToolbarProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded)
  const [announceChanges, setAnnounceChanges] = useState(false)
  const regionRef = useRef<HTMLElement>(null)
  const stateId = useId()
  const summaryId = useId()
  const isExpanded = expanded ?? uncontrolledExpanded
  const isBusy = state === 'dependency-loading' || state === 'updating'
  const normalizedLabel = label.trim() || 'Фильтры данных'
  const normalizedState = stateLabel?.trim() || STATE_LABELS[state]
  const normalizedResult = resultLabel.trim() || 'Результатов'
  const normalizedReset = resetLabel.trim() || 'Сбросить фильтры'
  const normalizedResetScope = resetScope.trim() || 'Все применённые фильтры'
  const validResultCount =
    resultCount !== undefined && Number.isFinite(resultCount) && resultCount >= 0
      ? Math.trunc(resultCount)
      : undefined
  const hasAppliedSummary = hasVisibleScope(appliedSummary)

  if ((state === 'applied' || state === 'empty') && !hasAppliedSummary) {
    throw new Error(`FilterToolbar ${state} state requires a visible applied summary`)
  }

  useEffect(() => setAnnounceChanges(true), [])

  const handleExpandedChange = (nextExpanded: boolean) => {
    if (expanded === undefined) setUncontrolledExpanded(nextExpanded)
    onExpandedChange?.(nextExpanded)
  }

  const handleReset = () => {
    onReset?.()
    window.setTimeout(() => {
      const requestedTarget = resetFocusRef?.current
      if (requestedTarget && canReceiveFocus(requestedTarget)) {
        requestedTarget.focus()
        if (document.activeElement === requestedTarget) return
      }
      regionRef.current?.focus()
    }, 0)
  }

  return (
    <section
      ref={regionRef}
      data-slot="filter-toolbar"
      data-state={state}
      aria-label={normalizedLabel}
      aria-describedby={`${stateId}${hasAppliedSummary ? ` ${summaryId}` : ''}`}
      aria-busy={isBusy || undefined}
      tabIndex={-1}
      className={cn('rounded-lg border border-border bg-card p-3 sm:p-4', className)}
    >
      <h2 className="mb-3 text-sm font-semibold text-foreground">{normalizedLabel}</h2>
      <Collapsible open={isExpanded} onOpenChange={handleExpandedChange} asChild>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div
              data-slot="filter-toolbar-primary"
              className="flex min-w-0 flex-1 flex-wrap items-end gap-3 [&>*]:min-w-0"
            >
              {primaryControls}
            </div>

            {(secondaryControls || actions) && (
              <div
                data-slot="filter-toolbar-actions"
                className="flex min-w-0 flex-wrap items-center gap-2 [&_button]:min-h-11 [&_button]:max-w-full"
              >
                {secondaryControls && (
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-w-11 whitespace-normal break-words"
                    >
                      {isExpanded ? collapseLabel : expandLabel}
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          'size-4 transition-transform motion-reduce:transition-none',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                )}
                {actions}
              </div>
            )}
          </div>

          {secondaryControls && (
            <CollapsibleContent asChild>
              <div data-slot="filter-toolbar-secondary" className="min-w-0 [&>*]:min-w-0">
                {secondaryControls}
              </div>
            </CollapsibleContent>
          )}

          <div className="flex min-w-0 flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              {hasAppliedSummary && (
                <div
                  id={summaryId}
                  data-slot="filter-toolbar-applied"
                  className="break-words text-sm text-foreground"
                >
                  <span className="font-medium">Применено: </span>
                  {appliedSummary}
                </div>
              )}
              {validResultCount !== undefined && (
                <div
                  data-slot="filter-toolbar-results"
                  aria-live={announceChanges ? 'polite' : 'off'}
                  aria-atomic="true"
                  className="text-sm font-medium text-foreground tabular-nums"
                >
                  {normalizedResult}: {validResultCount.toLocaleString('ru-RU')}
                </div>
              )}
              <div
                id={stateId}
                data-slot="filter-toolbar-state"
                role="status"
                aria-live={announceChanges && isBusy ? 'polite' : 'off'}
                className="text-sm text-muted-foreground"
              >
                {normalizedState}
              </div>
            </div>

            {onReset && (
              <div className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
                <span className="break-words text-xs text-muted-foreground">
                  Сбросит: {normalizedResetScope}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  aria-label={normalizedReset}
                  className="min-h-11 min-w-11 max-w-full whitespace-normal break-words"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {normalizedReset}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Collapsible>
    </section>
  )
}
