/**
 * ExpenseMetricCard - Base expense card for Story 62.5-FE
 * Inverted comparison: decrease = positive (green), increase = negative (red)
 * Sub-components: ExpenseMetricCardStates (skeleton, error)
 * @see docs/stories/epic-62/story-62.5-fe-expense-metrics-cards.md
 */

'use client'

import { Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ExpenseCardSkeleton, ExpenseCardError } from './ExpenseMetricCardStates'

export interface ExpenseMetricCardProps {
  title: string
  tooltip: string
  icon: React.ComponentType<{ className?: string }>
  valueColor: string
  value: number | null | undefined
  previousValue: number | null | undefined
  revenueTotal?: number | null
  isLoading?: boolean
  error?: Error | null
  className?: string
  onRetry?: () => void
}

function calculateRevenuePercentage(
  expense: number | null | undefined,
  revenue: number | null | undefined
): string | null {
  if (expense == null || revenue == null || revenue === 0) return null
  return formatPercentage((expense / revenue) * 100)
}

/** Base expense metric card - used by Advertising, Logistics, Storage cards */
export function ExpenseMetricCard({
  title,
  tooltip,
  icon: Icon,
  valueColor,
  value,
  previousValue,
  revenueTotal,
  isLoading = false,
  error,
  className,
  onRetry,
}: ExpenseMetricCardProps): React.ReactElement {
  if (isLoading) return <ExpenseCardSkeleton className={className} />

  if (error) {
    return (
      <ExpenseCardError
        title={title}
        icon={Icon}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  // Inverted comparison: lower expenses = positive (green)
  const comparison =
    value != null && previousValue != null ? calculateComparison(value, previousValue, true) : null

  const revenuePercentage = calculateRevenuePercentage(value, revenueTotal)

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`${title}: ${value != null ? formatCurrency(value) : 'нет данных'}`}
      data-testid="metric-card"
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', valueColor)} />
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Подробнее о метрике ${title}`}
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Value */}
        <div className="mt-1">
          <span className={cn('text-xl font-bold', valueColor)} data-testid="metric-value">
            {value != null ? formatCurrency(value) : '—'}
          </span>
        </div>

        {/* Comparison */}
        {comparison && (
          <div className="mt-1 flex items-center gap-1.5">
            <TrendIndicator direction={comparison.direction} size="sm" />
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
            <span className="text-xs text-muted-foreground">
              vs {formatCurrency(previousValue!)}
            </span>
          </div>
        )}

        {/* Revenue % subtitle */}
        {revenuePercentage && (
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">{revenuePercentage} от выручки</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
