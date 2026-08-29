'use client'

import type { ReactNode } from 'react'
import { RefreshCw, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ContextBarState = keyof typeof STATE_LABELS

export type ContextValue = Exclude<ReactNode, null | undefined | boolean>

export interface ContextItem {
  /** Stable id unique among caller-provided items. */
  id: string
  /** Already-localized visible text for the value. */
  label: string
  value: ContextValue
}

export interface ContextBarProps {
  /** Generic items are useful for domain-specific context beyond the common fields. */
  items?: ContextItem[]
  /** Common decision-scope fields. Controls remain route-owned nodes. */
  cabinet?: ContextValue
  period?: ContextValue
  comparison?: ContextValue
  freshness?: ContextValue
  completeness?: ContextValue
  scope?: ContextValue
  cabinetLabel?: string
  periodLabel?: string
  comparisonLabel?: string
  freshnessLabel?: string
  completenessLabel?: string
  scopeLabel?: string
  /** Semantic state is shown as text and is never conveyed by color alone. */
  state?: ContextBarState
  stateLabel?: string
  /** Route-owned refresh/reset behavior. No context is changed implicitly. */
  onRefresh?: () => void
  isRefreshing?: boolean
  refreshLabel?: string
  onReset?: () => void
  resetLabel?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

const STATE_LABELS = {
  fresh: 'Данные актуальны',
  refreshing: 'Обновление данных',
  stale: 'Данные требуют обновления',
  partial: 'Данные неполные',
  unavailable: 'Данные недоступны',
  restricted: 'Доступ ограничен',
  overridden: 'Контекст переопределён',
  default: 'Контекст по умолчанию',
} as const

function hasContextValue(value: ReactNode): value is ContextValue {
  return value !== undefined && value !== null && typeof value !== 'boolean' && value !== ''
}

function ContextItemView({ item, namespace }: { item: ContextItem; namespace: string }) {
  return (
    <div
      data-slot="context-item"
      data-context-id={`${namespace}:${item.id}`}
      className="min-w-0 space-y-0.5 rounded-md px-2 py-1"
    >
      <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{item.value}</dd>
    </div>
  )
}

/**
 * Shared decision-context strip. It renders values and route-owned controls,
 * but intentionally has no knowledge of URL/search, query, cabinet, or period
 * state. This keeps context changes explicit and prevents hidden side effects.
 */
export function ContextBar({
  items = [],
  cabinet,
  period,
  comparison,
  freshness,
  completeness,
  scope,
  cabinetLabel = 'Кабинет',
  periodLabel = 'Период',
  comparisonLabel = 'Сравнение',
  freshnessLabel = 'Актуальность',
  completenessLabel = 'Полнота',
  scopeLabel = 'Область',
  state,
  stateLabel,
  onRefresh,
  isRefreshing = false,
  refreshLabel = 'Обновить данные',
  onReset,
  resetLabel = 'Сбросить контекст',
  actions,
  children,
  className,
}: ContextBarProps) {
  const resolvedItems = items.map(item => {
    const id = item.id.trim()
    const label = item.label.trim()

    if (!id) throw new Error('ContextBar item ids must be non-empty')
    if (!label) throw new Error('ContextBar item labels must be non-empty')
    if (!hasContextValue(item.value)) throw new Error('ContextBar item values must be non-empty')

    return { ...item, id, label }
  })
  const itemIds = resolvedItems.map(item => item.id)
  if (new Set(itemIds).size !== itemIds.length) {
    throw new Error('ContextBar item ids must be unique')
  }

  const commonEntries: Array<[id: string, label: string, value: ReactNode]> = [
    ['cabinet', cabinetLabel.trim() || 'Кабинет', cabinet],
    ['period', periodLabel.trim() || 'Период', period],
    ['comparison', comparisonLabel.trim() || 'Сравнение', comparison],
    ['freshness', freshnessLabel.trim() || 'Актуальность', freshness],
    ['completeness', completenessLabel.trim() || 'Полнота', completeness],
    ['scope', scopeLabel.trim() || 'Область', scope],
  ]
  const visibleCommonItems = commonEntries.flatMap(([id, label, value]) =>
    hasContextValue(value) ? [{ id, label, value }] : []
  )
  const effectiveState: ContextBarState = isRefreshing ? 'refreshing' : (state ?? 'default')
  const resolvedStateLabel = isRefreshing
    ? STATE_LABELS.refreshing
    : stateLabel?.trim() || STATE_LABELS[effectiveState]
  const resolvedRefreshLabel = refreshLabel.trim() || 'Обновить данные'
  const resolvedResetLabel = resetLabel.trim() || 'Сбросить контекст'
  const isBusy = effectiveState === 'refreshing'

  return (
    <section
      data-slot="context-bar"
      data-state={effectiveState}
      aria-label="Контекст страницы"
      className={cn(
        'rounded-lg border border-border bg-muted/30 px-3 py-2',
        'supports-[backdrop-filter]:bg-muted/20 sm:px-4',
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <dl className="-mx-2 flex min-w-0 flex-1 flex-wrap items-start gap-x-2 gap-y-1">
          {visibleCommonItems.map(item => (
            <ContextItemView key={`builtin:${item.id}`} item={item} namespace="builtin" />
          ))}
          {resolvedItems.map(item => (
            <ContextItemView key={`custom:${item.id}`} item={item} namespace="custom" />
          ))}
          {resolvedStateLabel && (
            <div data-slot="context-state" className="px-2 py-1">
              <dt className="sr-only">Состояние данных</dt>
              {/* prettier-ignore */}
              <dd className="text-sm font-medium text-muted-foreground"><span role="status" aria-live="polite">{resolvedStateLabel}</span></dd>
            </div>
          )}
        </dl>
        {children && (
          <div
            data-slot="context-bar-content"
            className="flex min-w-0 flex-wrap items-center gap-2"
          >
            {children}
          </div>
        )}

        {(onRefresh || onReset || actions) && (
          <div
            data-slot="context-bar-actions"
            className="flex min-w-0 flex-wrap items-center gap-2 [&_button]:h-auto [&_button]:min-h-11 [&_button]:max-w-full [&_button]:whitespace-normal [&_button]:break-words"
          >
            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={isBusy ? undefined : onRefresh}
                aria-disabled={isBusy || undefined}
                aria-label={isBusy ? `${resolvedRefreshLabel} — выполняется` : resolvedRefreshLabel}
                aria-busy={isBusy || undefined}
                className="min-h-11 min-w-11 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn('size-4', isBusy && 'animate-spin motion-reduce:animate-none')}
                />
                <span className="sr-only sm:not-sr-only">
                  {isBusy ? 'Обновление…' : resolvedRefreshLabel}
                </span>
              </Button>
            )}
            {onReset && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                aria-label={resolvedResetLabel}
                className="min-h-11 min-w-11"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                <span className="sr-only sm:not-sr-only">{resolvedResetLabel}</span>
              </Button>
            )}
            {actions}
          </div>
        )}
      </div>
    </section>
  )
}

export default ContextBar
