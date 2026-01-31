/**
 * Trend Badge Component
 * Story 63.6-FE: Storage Trends Chart Enhancement (Dashboard)
 * Epic 63: Dashboard Main Page (Frontend)
 *
 * Displays trend percentage with semantic coloring.
 * For storage costs: increase (bad) = red, decrease (good) = green
 *
 * @see docs/stories/epic-63/story-63.6-fe-storage-trends-chart.md
 */

'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TrendBadgeProps {
  /** Trend percentage (positive = increase, negative = decrease) */
  trend: number
  /** Invert colors: true for costs (increase=bad), false for revenue (increase=good) */
  invertColors?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Trend badge with semantic coloring
 *
 * @example
 * // For storage costs (increase is bad)
 * <TrendBadge trend={10.5} invertColors />
 *
 * // For revenue (increase is good)
 * <TrendBadge trend={10.5} />
 */
export function TrendBadge({ trend, invertColors = false, className }: TrendBadgeProps) {
  const isPositive = trend > 0
  const isNegative = trend < 0
  const isNeutral = trend === 0

  // Determine color based on trend direction and inversion
  // For costs (invertColors=true): increase=red, decrease=green
  // For revenue (invertColors=false): increase=green, decrease=red
  const getColorClass = () => {
    if (isNeutral) return 'text-gray-600 bg-gray-50 border-gray-200'
    if (invertColors) {
      return isPositive
        ? 'text-red-600 bg-red-50 border-red-200'
        : 'text-green-600 bg-green-50 border-green-200'
    }
    return isPositive
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200'
  }

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const sign = isPositive ? '+' : ''

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium border',
        getColorClass(),
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span>
        Тренд: {sign}
        {trend.toFixed(1)}%
      </span>
    </div>
  )
}
