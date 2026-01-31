/**
 * Trends Summary Card Component
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * Summary statistics card showing min, max, avg, and trend for a metric.
 *
 * @see docs/stories/epic-63/story-63.12-fe-historical-trends-section.md
 */

'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { formatWeekLabel } from './trends-config'

export interface TrendsSummaryCardProps {
  /** Metric title (e.g., "Выручка") */
  title: string
  /** Minimum value with week */
  min: { value: number; week: string }
  /** Maximum value with week */
  max: { value: number; week: string }
  /** Average value */
  avg: number
  /** Trend percentage (first vs last) */
  trendPct: number
  /** Value format type */
  format: 'currency' | 'percentage'
  /** Color for left border */
  color: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Format value based on type
 */
function formatValue(value: number, format: 'currency' | 'percentage'): string {
  if (format === 'percentage') {
    return `${value.toFixed(1).replace('.', ',')}%`
  }
  return formatCurrency(value)
}

/**
 * Get trend direction
 */
function getTrendDirection(trendPct: number): 'up' | 'down' | 'neutral' {
  if (Math.abs(trendPct) < 0.1) return 'neutral'
  return trendPct > 0 ? 'up' : 'down'
}

/**
 * Summary statistics card for a single metric
 */
export function TrendsSummaryCard({
  title,
  min,
  max,
  avg,
  trendPct,
  format,
  color,
  className,
}: TrendsSummaryCardProps): React.ReactElement {
  const direction = getTrendDirection(trendPct)
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus

  const trendColor =
    direction === 'up' ? 'text-green-600' : direction === 'down' ? 'text-red-600' : 'text-gray-500'

  return (
    <div
      className={cn('rounded-md border bg-white p-3', className)}
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      {/* Title */}
      <div className="mb-2 text-xs font-medium" style={{ color }}>
        {title}
      </div>

      {/* Min/Max/Avg */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>min:</span>
          <span className="font-medium text-foreground">
            {formatValue(min.value, format)} ({formatWeekLabel(min.week)})
          </span>
        </div>
        <div className="flex justify-between">
          <span>max:</span>
          <span className="font-medium text-foreground">
            {formatValue(max.value, format)} ({formatWeekLabel(max.week)})
          </span>
        </div>
        <div className="flex justify-between">
          <span>avg:</span>
          <span className="font-medium text-foreground">{formatValue(avg, format)}</span>
        </div>
      </div>

      {/* Trend */}
      <div className={cn('mt-2 flex items-center gap-1 text-sm font-semibold', trendColor)}>
        <TrendIcon className="h-4 w-4" />
        <span>
          {trendPct >= 0 ? '+' : ''}
          {trendPct.toFixed(1).replace('.', ',')}%
        </span>
      </div>
    </div>
  )
}
