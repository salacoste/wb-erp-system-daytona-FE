/**
 * TrendIndicator Component for Story 60.3-FE
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Displays a trend arrow icon (up/down/neutral) with semantic coloring.
 * Used as part of MetricCardEnhanced comparison display.
 *
 * @see docs/stories/epic-60/story-60.3-fe-enhanced-metric-card.md
 */

'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrendDirection } from '@/lib/comparison-helpers'

export interface TrendIndicatorProps {
  /** Trend direction determines icon and color */
  direction: TrendDirection
  /** Size variant: sm (12px), md (16px), lg (20px) */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

/** Icon component mapping by direction */
const ICON_MAP: Record<TrendDirection, React.ComponentType<{ className?: string }>> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
}

/** Semantic color classes by direction */
const COLOR_MAP: Record<TrendDirection, string> = {
  positive: 'text-green-600',
  negative: 'text-red-500',
  neutral: 'text-muted-foreground',
}

/** Size classes for icon dimensions */
const SIZE_MAP: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

/** Russian ARIA labels for accessibility */
const ARIA_LABELS: Record<TrendDirection, string> = {
  positive: 'Рост',
  negative: 'Снижение',
  neutral: 'Без изменений',
}

/**
 * Trend arrow indicator component
 *
 * Displays:
 * - TrendingUp (green) for positive changes
 * - TrendingDown (red) for negative changes
 * - Minus (gray) for neutral/no change
 *
 * @example
 * <TrendIndicator direction="positive" size="sm" />
 */
export function TrendIndicator({
  direction,
  size = 'md',
  className,
}: TrendIndicatorProps): React.ReactElement {
  const Icon = ICON_MAP[direction]

  return (
    <Icon
      data-testid="trend-indicator"
      className={cn(SIZE_MAP[size], COLOR_MAP[direction], className)}
      aria-label={ARIA_LABELS[direction]}
    />
  )
}
