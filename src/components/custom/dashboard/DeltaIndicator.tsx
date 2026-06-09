/**
 * Delta Indicator Component
 * Story 63.11-FE: WoW/MoM Period Comparison Cards
 *
 * Displays change indicator with arrow and percentage badge.
 * Supports inverted direction logic for expense metrics.
 *
 * @see docs/stories/epic-63/story-63.11-fe-period-comparison-cards.md
 */

'use client'

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DeltaIndicatorProps {
  /** Percentage change value */
  percent: number
  /** True for expense metrics where decrease is positive */
  invertDirection?: boolean
  /** Show absolute change value */
  absoluteChange?: string
  /** Additional CSS classes */
  className?: string
}

/** Threshold below which change is considered neutral */
const NEUTRAL_THRESHOLD = 0.1

/** Maximum display percentage (larger values show "999+%") */
const MAX_DISPLAY_PERCENT = 999

/**
 * Determines the semantic direction based on percent change and inversion
 */
function getDirection(
  percent: number,
  invertDirection: boolean
): 'positive' | 'negative' | 'neutral' {
  if (Math.abs(percent) < NEUTRAL_THRESHOLD) return 'neutral'

  const isIncrease = percent > 0
  if (invertDirection) {
    // For expenses: decrease = positive (green), increase = negative (red)
    return isIncrease ? 'negative' : 'positive'
  }
  // For revenue metrics: increase = positive (green), decrease = negative (red)
  return isIncrease ? 'positive' : 'negative'
}

/** Color styles by direction */
const DIRECTION_STYLES = {
  positive: 'bg-green-100 text-green-700',
  negative: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-600',
} as const

/** Arrow icons by direction */
const DIRECTION_ICONS = {
  positive: ArrowUp,
  negative: ArrowDown,
  neutral: Minus,
} as const

/**
 * Formats percentage for display with capping at 999%
 */
function formatPercent(value: number): string {
  const absValue = Math.abs(value)
  if (absValue > MAX_DISPLAY_PERCENT) {
    return '999+%'
  }
  return `${absValue.toFixed(1).replace('.', ',')}%`
}

/**
 * Delta indicator badge showing change direction and percentage
 */
export function DeltaIndicator({
  percent,
  invertDirection = false,
  absoluteChange,
  className,
}: DeltaIndicatorProps): React.ReactElement {
  const direction = getDirection(percent, invertDirection)
  const ArrowIcon = DIRECTION_ICONS[direction]
  const formattedPercent = formatPercent(percent)

  // Determine aria label for accessibility
  const directionLabel =
    direction === 'positive' ? 'рост' : direction === 'negative' ? 'снижение' : 'без изменений'
  const ariaLabel = `${directionLabel}: ${formattedPercent}${absoluteChange ? `, ${absoluteChange}` : ''}`

  return (
    <span
      data-testid="delta-indicator"
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5',
        'text-xs font-semibold',
        DIRECTION_STYLES[direction],
        className
      )}
      aria-label={ariaLabel}
    >
      <ArrowIcon className="h-3 w-3" aria-hidden="true" />
      <span>
        {percent >= 0 && direction !== 'neutral' ? '+' : ''}
        {formattedPercent}
      </span>
    </span>
  )
}
