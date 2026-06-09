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

  const chipClasses = cn(
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
    'cursor-pointer transition-all duration-150 border-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary',
    {
      'bg-gray-100 text-gray-700 border-transparent': isNeutral && !isActive,
      'bg-gray-200 text-gray-900 border-gray-500': isNeutral && isActive,
      [config?.bgColor ?? '']: !isNeutral && !isActive,
      [config?.bgColorActive ?? '']: !isNeutral && isActive,
      [config?.color ?? '']: !isNeutral,
      'border-transparent': !isNeutral && !isActive,
      [config?.borderColor ?? '']: !isNeutral && isActive,
      'opacity-50 cursor-not-allowed': disabled,
    }
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
