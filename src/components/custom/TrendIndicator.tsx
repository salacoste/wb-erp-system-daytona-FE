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

/** Semantic color classes by direction.
 * Wave-4 boundary sweep: money-direction icons -> financial tokens (wave-1 canon #2).
 * Icon-only glyphs need >=3:1 (non-text); measured over the 2 real mounts (pass-1
 * review: buyout-table-cells/SneakPreview/SupplyDetail carry same-name LOCAL
 * components, not this one): plain card + highlighted gradient worst-end
 * (from-status-success/10): finPos worst 4.49 light / 7.97 dark, finNeg worst
 * 4.93 light / 7.45 dark — all pass. Latent branch (pass-2): BaseMetricCard
 * sentimentBg mounts flat bg-status-error/10 (BaseMetricCardHelpers) — no production
 * caller today; finNeg there = 4.77 light / 7.31 dark, still >=3:1 for icons. */
const COLOR_MAP: Record<TrendDirection, string> = {
  positive: 'text-financial-positive',
  negative: 'text-financial-negative',
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
