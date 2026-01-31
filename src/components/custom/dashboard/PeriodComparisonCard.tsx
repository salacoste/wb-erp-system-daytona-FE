/**
 * Period Comparison Card Component
 * Story 63.11-FE: WoW/MoM Period Comparison Cards
 *
 * Individual metric card showing current value, previous value, and delta.
 *
 * @see docs/stories/epic-63/story-63.11-fe-period-comparison-cards.md
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DeltaIndicator } from './DeltaIndicator'
import { formatCurrency, cn } from '@/lib/utils'

export interface DeltaValue {
  absolute: number
  percent: number
}

export interface PeriodComparisonCardProps {
  /** Card title (e.g., "Выручка") */
  title: string
  /** Current period value */
  currentValue: number | null
  /** Previous period value */
  previousValue: number | null
  /** Delta between periods */
  delta: DeltaValue | null
  /** Current period label (e.g., "W05") */
  currentPeriodLabel: string
  /** Previous period label (e.g., "W04") */
  previousPeriodLabel: string
  /** Value format type */
  format: 'currency' | 'percentage' | 'number'
  /** True for expense metrics where decrease is positive */
  invertDirection?: boolean
  /** Loading state */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Formats value based on type
 */
function formatValue(value: number | null, format: 'currency' | 'percentage' | 'number'): string {
  if (value === null || value === undefined) return '—'

  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
      return `${value.toFixed(1).replace('.', ',')}%`
    case 'number':
      return new Intl.NumberFormat('ru-RU').format(value)
  }
}

/**
 * Loading skeleton for card
 */
function CardSkeleton({ className }: { className?: string }): React.ReactElement {
  return (
    <Card className={cn('p-4', className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="mt-3 h-7 w-32" />
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Individual comparison metric card
 */
export function PeriodComparisonCard({
  title,
  currentValue,
  previousValue,
  delta,
  currentPeriodLabel,
  previousPeriodLabel,
  format,
  invertDirection = false,
  isLoading = false,
  className,
}: PeriodComparisonCardProps): React.ReactElement {
  if (isLoading) return <CardSkeleton className={className} />

  const formattedCurrent = formatValue(currentValue, format)
  const formattedPrevious = formatValue(previousValue, format)
  const ariaLabel = `${title}: ${formattedCurrent}${delta ? `, изменение ${delta.percent >= 0 ? '+' : ''}${delta.percent.toFixed(1)}%` : ''}`

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={ariaLabel}
    >
      <CardContent className="p-4">
        {/* Header: title and period label */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">{currentPeriodLabel}</span>
        </div>

        {/* Current value (large) */}
        <div className="mt-2">
          <span className="text-2xl font-bold text-foreground">{formattedCurrent}</span>
        </div>

        {/* Delta indicator and previous value */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {delta && (
            <DeltaIndicator
              percent={delta.percent}
              invertDirection={invertDirection}
              absoluteChange={
                format === 'currency'
                  ? `${delta.absolute >= 0 ? '+' : ''}${formatCurrency(delta.absolute)}`
                  : undefined
              }
            />
          )}
          <span className="text-xs text-muted-foreground">
            vs {formattedPrevious} ({previousPeriodLabel})
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
