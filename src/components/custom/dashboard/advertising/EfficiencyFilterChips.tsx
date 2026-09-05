/**
 * EfficiencyFilterChips Component
 * Story 63.4-FE: Advertising Efficiency Filter UI
 *
 * Filter chips for filtering advertising data by efficiency status.
 * Features: 5 chips + "Все", color-coded, count badges, toggle, URL sync, accessible.
 *
 * @see docs/stories/epic-63/story-63.4-fe-advertising-efficiency-filter.md
 */

'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { efficiencyFilterConfig, FILTER_ORDER } from '@/lib/efficiency-filter-config'
import { useEfficiencyFilter } from '@/hooks/useEfficiencyFilter'
import type { EfficiencyCountsSummary, FilterableEfficiencyStatus } from '@/types/efficiency-filter'

/** Props for EfficiencyFilterChips component. */
export interface EfficiencyFilterChipsProps {
  counts: EfficiencyCountsSummary
  isLoading?: boolean
  className?: string
}

/** EfficiencyFilterChips displays filter chips for advertising efficiency status. */
export function EfficiencyFilterChips({
  counts,
  isLoading = false,
  className,
}: EfficiencyFilterChipsProps) {
  const { activeFilter, setFilter } = useEfficiencyFilter()

  if (isLoading) {
    return (
      <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
        <Skeleton className="h-7 w-16 rounded-full" />
        {FILTER_ORDER.map(status => (
          <Skeleton key={status} className="h-7 w-20 rounded-full" />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('flex gap-2 overflow-x-auto pb-2', className)}
      role="group"
      aria-label="Фильтр по эффективности рекламы"
    >
      <FilterChip
        label="Все"
        count={counts.total}
        isActive={activeFilter === null}
        onClick={() => setFilter(null)}
        variant="neutral"
      />
      {FILTER_ORDER.map(status => {
        const config = efficiencyFilterConfig[status]
        return (
          <FilterChip
            key={status}
            label={config.label}
            count={counts[status]}
            isActive={activeFilter === status}
            onClick={() => setFilter(status)}
            config={config}
            description={config.description}
            disabled={counts[status] === 0}
          />
        )
      })}
    </div>
  )
}

/** Props for individual FilterChip. */
interface FilterChipProps {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
  config?: (typeof efficiencyFilterConfig)[FilterableEfficiencyStatus]
  variant?: 'neutral'
  description?: string
  disabled?: boolean
}

/** Individual filter chip with styling, accessibility, and optional tooltip. */
function FilterChip({
  label,
  count,
  isActive,
  onClick,
  config,
  variant,
  description,
  disabled,
}: FilterChipProps) {
  const isNeutral = variant === 'neutral'
  // P2 wave-5 fix (review pass-1 finding 1): SOLID tiers keep bgColor ===
  // bgColorActive, so an active solid chip is pixel-identical to its inactive
  // state (border-status-X on bg-status-X is same-hue; only the <3:1 count
  // badge differs). Restore the active affordance with the repo's
  // selected-state ring idiom (CoefficientCalendarCells.tsx:58 isSelected
  // pattern). Soft tiers already discriminate via bg tint + border, neutral
  // via bg-muted + border-border — neither gets the ring.
  const isSolidTier =
    !!config && config.bgColor.length > 0 && config.bgColor === config.bgColorActive

  const chipClasses = cn(
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
    'cursor-pointer transition-all duration-150 border-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary',
    {
      'bg-muted text-muted-foreground border-transparent': isNeutral && !isActive,
      'bg-muted text-foreground border-border': isNeutral && isActive,
      // Single computed bg key: P2 wave-5 solid tiers have bgColor === bgColorActive,
      // and two computed keys with the SAME name collapse in the object literal
      // (later `false` wins), silently dropping the inactive chip's background.
      // That same equality flattens the solid tiers' two states into one look,
      // so an active solid chip additionally carries the selected-state ring
      // below (>=3:1 vs card, harness W5-G) as its state affordance.
      [(isActive ? config?.bgColorActive : config?.bgColor) ?? '']: !isNeutral,
      [config?.color ?? '']: !isNeutral,
      'border-transparent': !isNeutral && !isActive,
      [config?.borderColor ?? '']: !isNeutral && isActive,
      'opacity-50 cursor-not-allowed': disabled,
    },
    // Solid-tier active affordance: variadic clsx arg (cond && 'class' is not
    // valid inside the object literal above).
    isSolidTier && isActive && 'ring-2 ring-ring ring-offset-1'
  )

  const ariaLabel = `${label}: ${count} элементов${isActive ? ', выбрано' : ''}`

  const chip = (
    <button
      className={chipClasses}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      type="button"
    >
      <span>{label}</span>
      <Badge
        variant="secondary"
        className={cn(
          'ml-1 px-1.5 py-0 text-xs font-normal',
          isActive ? 'bg-white/50' : 'bg-black/5'
        )}
      >
        {count}
      </Badge>
    </button>
  )

  if (description) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent side="bottom" size="sm">
          {description}
        </TooltipContent>
      </Tooltip>
    )
  }

  return chip
}
