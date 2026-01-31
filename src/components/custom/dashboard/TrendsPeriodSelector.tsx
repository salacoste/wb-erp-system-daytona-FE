/**
 * Trends Period Selector Component
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * Toggle button group for selecting trend period (4w, 8w, 12w).
 *
 * @see docs/stories/epic-63/story-63.12-fe-historical-trends-section.md
 */

'use client'

import { cn } from '@/lib/utils'

export type TrendsPeriod = 4 | 8 | 12

export interface TrendsPeriodSelectorProps {
  /** Current selected period in weeks */
  value: TrendsPeriod
  /** Callback when period changes */
  onChange: (weeks: TrendsPeriod) => void
  /** Disable selector during loading */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

const PERIOD_OPTIONS: TrendsPeriod[] = [4, 8, 12]

/**
 * Toggle button group for selecting trend period
 */
export function TrendsPeriodSelector({
  value,
  onChange,
  disabled = false,
  className,
}: TrendsPeriodSelectorProps): React.ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label="Период отображения"
      className={cn('inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5', className)}
    >
      {PERIOD_OPTIONS.map(weeks => {
        const isActive = value === weeks
        return (
          <button
            key={weeks}
            role="radio"
            aria-checked={isActive}
            aria-label={`${weeks} недель`}
            disabled={disabled}
            onClick={() => onChange(weeks)}
            className={cn(
              'rounded px-3 py-1.5 text-xs font-medium transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-100',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {weeks}w
          </button>
        )
      })}
    </div>
  )
}
