'use client'

import { cn } from '@/lib/utils'

/**
 * Period option type for seasonal patterns
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 */
export type PeriodOption = 4 | 12 | 24

export const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: 4, label: '4W' },
  { value: 12, label: '12W' },
  { value: 24, label: '24W' },
]

interface PeriodSelectorGroupProps {
  value: PeriodOption
  onChange: (value: PeriodOption) => void
}

/**
 * Inline radio-button group for period selection
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 */
export function PeriodSelectorGroup({ value, onChange }: PeriodSelectorGroupProps) {
  return (
    <div className="inline-flex rounded-md border border-border" role="radiogroup">
      {PERIOD_OPTIONS.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium transition-colors',
            option.value === 4 && 'rounded-l-md',
            option.value === 24 && 'rounded-r-md',
            value === option.value
              ? 'bg-[#E53935] text-white'
              : 'bg-card text-muted-foreground hover:bg-muted'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
