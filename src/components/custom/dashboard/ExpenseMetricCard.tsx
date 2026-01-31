/**
 * ExpenseMetricCard - Base expense card for Story 62.5-FE
 * Inverted comparison: decrease = positive (green), increase = negative (red)
 * @see docs/stories/epic-62/story-62.5-fe-expense-metrics-cards.md
 */

'use client'

import { Info, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'

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

interface SkeletonProps {
  className?: string
}

interface ErrorProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  error: Error
  onRetry?: () => void
  className?: string
}

function calculateRevenuePercentage(
  expense: number | null | undefined,
  revenue: number | null | undefined
): string | null {
  if (expense == null || revenue == null || revenue === 0) return null
  return formatPercentage((expense / revenue) * 100)
}

/** Skeleton loading state */
function ExpenseCardSkeleton({ className }: SkeletonProps): React.ReactElement {
  return (
    <Card className={className} data-testid="expense-card-skeleton" aria-busy="true">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mt-2 h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-28" />
        <Skeleton className="mt-1 h-3 w-20" />
      </CardContent>
    </Card>
  )
}

/** Error state with retry */
function ExpenseCardError({ title, icon: Icon, error, onRetry, className }: ErrorProps) {
  return (
    <Card className={className} data-testid="expense-card-error" role="alert">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <div className="mt-2 text-sm text-destructive">Ошибка загрузки данных</div>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="mt-2">
            <RefreshCw className="mr-1 h-3 w-3" />
            Повторить
          </Button>
        )}
      </CardContent>
    </Card>
  )
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
    >
      <CardContent className="p-4">
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
            <TooltipContent size="md">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Value */}
        <div className="mt-2">
          <span className={cn('text-2xl font-bold', valueColor)} data-testid="metric-value">
            {value != null ? formatCurrency(value) : '—'}
          </span>
        </div>

        {/* Comparison */}
        {comparison && (
          <div className="mt-2 flex items-center gap-1.5">
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
            <span className="text-xs text-gray-400">{revenuePercentage} от выручки</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
