/**
 * SimpleMetricCard — Generic compact metric card
 * Used for granular P&L metrics in the dashboard grid.
 * Supports optional comparison badges and tooltips.
 */

'use client'

import type { LucideIcon } from 'lucide-react'
import { Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface SimpleMetricCardProps {
  icon: LucideIcon
  iconColor?: string
  title: string
  /** Formatted display value (e.g. "1 234 ₽", "252 шт") */
  value: string
  valueColor?: string
  /** Raw current value for comparison calculation */
  current?: number | null
  /** Raw previous value for comparison calculation */
  previous?: number | null
  /** True for costs where decrease is positive */
  invertComparison?: boolean
  subtitle?: string
  tooltip?: string
  className?: string
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

export function SimpleMetricCard({
  icon: Icon,
  iconColor = 'text-blue-500',
  title,
  value,
  valueColor,
  current,
  previous,
  invertComparison = false,
  subtitle,
  tooltip,
  className,
  isLoading = false,
  error,
  onRetry,
}: SimpleMetricCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title={title}
        icon={Icon}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const comparison =
    current != null && previous != null && previous !== 0
      ? calculateComparison(current, previous, invertComparison)
      : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`${title}: ${value}`}
      data-testid="metric-card"
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', iconColor)} aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Подробнее: ${title}`}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent size="lg">
                <p style={{ whiteSpace: 'pre-line' }}>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="mt-1">
          <span className={cn('text-xl font-bold', valueColor)}>{value}</span>
        </div>
        {comparison && (
          <div className="mt-1 flex items-center gap-1.5">
            <TrendIndicator direction={comparison.direction} size="sm" />
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}
        {subtitle && (
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
