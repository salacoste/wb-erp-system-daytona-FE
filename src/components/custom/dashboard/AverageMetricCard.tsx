/**
 * AverageMetricCard — Individual average metric card (Story 65.2)
 * Displays a single average metric with currency formatting,
 * optional color coding by sign, and comparison with previous period.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md
 */

'use client'

import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'

export interface AverageMetricCardProps {
  /** Card title (Russian locale) */
  title: string
  /** Computed average value, or null/undefined for missing data */
  value: number | null | undefined
  /** Previous period value for comparison */
  previousValue?: number | null | undefined
  /** Color the value by sign: green if >0, red if <0 */
  colorBySign?: boolean
  /** Hint text shown below value (e.g., "Заполните COGS") */
  hint?: string
  /** Loading state */
  isLoading: boolean
  /** Additional CSS classes */
  className?: string
}

/** Determine value color class based on sign */
function getSignColor(value: number): string {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-500'
  return ''
}

/**
 * Individual average metric card with currency formatting.
 * Uses role="article" for accessibility and test selection.
 */
export function AverageMetricCard({
  title,
  value,
  previousValue,
  colorBySign = false,
  hint,
  isLoading,
  className,
}: AverageMetricCardProps): React.ReactElement {
  const hasValue = value != null && isFinite(value)
  const formattedValue = hasValue ? formatCurrency(value) : '—'

  const comparison =
    hasValue && previousValue != null ? calculateComparison(value, previousValue) : null

  const valueColorClass = colorBySign && hasValue ? getSignColor(value) : ''

  if (isLoading) {
    return (
      <div
        role="article"
        aria-label={title}
        className={cn('rounded-lg border bg-card p-3 animate-pulse', className)}
      >
        <div className="h-3 w-20 bg-muted rounded mb-2" />
        <div className="h-5 w-16 bg-muted rounded" />
      </div>
    )
  }

  return (
    <div
      role="article"
      aria-label={`${title}: ${formattedValue}`}
      className={cn(
        'rounded-lg border bg-card p-3',
        'transition-shadow hover:shadow-sm',
        className
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{title}</span>

      <div className="mt-1 flex items-baseline gap-1">
        <span
          data-testid="average-metric-value"
          className={cn('text-lg font-bold', valueColorClass)}
        >
          {formattedValue}
        </span>
      </div>

      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}

      {comparison && (
        <div className="mt-1 flex items-center gap-1">
          <TrendIndicator direction={comparison.direction} size="sm" />
          <ComparisonBadge
            percentageChange={comparison.percentageChange}
            direction={comparison.direction}
            absoluteDifference={comparison.formattedDifference}
          />
        </div>
      )}
    </div>
  )
}
