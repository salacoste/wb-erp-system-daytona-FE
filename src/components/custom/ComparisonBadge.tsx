/**
 * ComparisonBadge Component for Story 60.3-FE
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Displays a percentage change badge with semantic background color.
 * Shows absolute difference on hover via tooltip.
 *
 * @see docs/stories/epic-60/story-60.3-fe-enhanced-metric-card.md
 */

'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatPercentage } from '@/lib/utils'
import type { TrendDirection } from '@/lib/comparison-helpers'

export interface ComparisonBadgeProps {
  /** Percentage change value (raw number, e.g., 10.5 for 10.5%) */
  percentageChange: number
  /** Trend direction determines badge color */
  direction: TrendDirection
  /** Formatted absolute difference for tooltip (e.g., "+1 000,00 ₽") */
  absoluteDifference?: string
  /** Additional CSS classes */
  className?: string
}

/** Background and text color classes by direction */
const COLOR_MAP: Record<TrendDirection, string> = {
  positive: 'bg-green-100 text-green-700',
  negative: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-600',
}

/**
 * Formats percentage value for badge display
 * Uses Russian locale with comma as decimal separator
 */
function formatBadgePercentage(value: number): string {
  // value is percent-units (e.g. 10.5 → "10,5 %"). formatPercentage adds the NBSP + comma and
  // emits the minus for negatives; we prepend "+" for positives. Was comma-WITHOUT-NBSP
  // (`Intl.format(abs) + '%'` → "10,5%") — a gate-blind Russian-locale violation.
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatPercentage(value, 1)}`
}

/**
 * Percentage change badge with semantic coloring
 *
 * Colors:
 * - Green background for positive direction
 * - Red background for negative direction
 * - Gray background for neutral
 *
 * @example
 * <ComparisonBadge
 *   percentageChange={10.5}
 *   direction="positive"
 *   absoluteDifference="+1 000,00 ₽"
 * />
 */
export function ComparisonBadge({
  percentageChange,
  direction,
  absoluteDifference,
  className,
}: ComparisonBadgeProps): React.ReactElement {
  const formattedPercentage = formatBadgePercentage(percentageChange)

  const badge = (
    <span
      data-testid="comparison-badge"
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5',
        'text-xs font-medium',
        'transition-transform hover:scale-105',
        COLOR_MAP[direction],
        className
      )}
    >
      {formattedPercentage}
    </span>
  )

  // Wrap with tooltip if absolute difference is provided
  if (absoluteDifference) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent size="sm">
          <p>{absoluteDifference}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return badge
}
