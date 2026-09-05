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

/** Background and text color classes by direction.
 * Wave-4 boundary sweep: money-direction valence via financial tokens. This badge mounts
 * BOTH on plain cards and on highlighted gradient cards (BaseMetricCard isHighlighted:
 * from-status-success/10 to-card), so colored financial text on a tint fails worst-end
 * (finPos/5 on gradient = 4.22 light; neg/5 = 4.57 marginal) -> structural remedy
 * fg-on-tint (wave-3 canon), applied to both directions for symmetric valence:
 * text-foreground on the valence tint; valence carried by tint + +/- label.
 * Measured over the full real stack (card > gradient worst-end success/10 > badge
 * fin/10 tint > fg — pass-1 review recalc): pos 12.45/12.60, neg 12.11/12.80; over
 * plain card pos 14.11/15.36, neg 13.75/15.48; neutral opaque bg-muted 7.17/8.06.
 * All AA both themes. fg-on-tint is hue-robust (pass-2): gradient hosts also carry
 * warn/error ends (TheoreticalProfit/GrossProfit/Net/OperatingProfitCard) — fg
 * measures >=11 on every end. */
const COLOR_MAP: Record<TrendDirection, string> = {
  positive: 'bg-financial-positive/10 text-foreground',
  negative: 'bg-financial-negative/10 text-foreground',
  neutral: 'bg-muted text-muted-foreground',
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
