/**
 * Comparison Mode Toggle Component
 * Story 63.11-FE: WoW/MoM Period Comparison Cards
 *
 * Toggle button group for switching between WoW and MoM comparison modes.
 *
 * @see docs/stories/epic-63/story-63.11-fe-period-comparison-cards.md
 */

'use client'

import { cn } from '@/lib/utils'

export type ComparisonMode = 'wow' | 'mom'

export interface ComparisonModeToggleProps {
  /** Current selected mode */
  mode: ComparisonMode
  /** Callback when mode changes */
  onChange: (mode: ComparisonMode) => void
  /** Disable toggle during loading */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

interface ModeOption {
  value: ComparisonMode
  label: string
  description: string
}

const MODE_OPTIONS: ModeOption[] = [
  { value: 'wow', label: 'WoW', description: 'Неделя к неделе' },
  { value: 'mom', label: 'MoM', description: 'Месяц к месяцу' },
]

/**
 * Toggle button group for WoW/MoM comparison modes
 */
export function ComparisonModeToggle({
  mode,
  onChange,
  disabled = false,
  className,
}: ComparisonModeToggleProps): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Режим сравнения"
      className={cn('inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5', className)}
    >
      {MODE_OPTIONS.map(option => {
        const isActive = mode === option.value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            aria-label={option.description}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded px-3 py-1.5 text-xs font-medium transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-100',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
