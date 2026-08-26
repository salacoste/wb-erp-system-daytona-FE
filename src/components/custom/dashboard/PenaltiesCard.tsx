/**
 * PenaltiesCard -- Story 65.12: Penalties Card (Штрафы)
 *
 * Shows penalties_amount (monetary value) with inverted comparison logic.
 * Higher penalties = bad = red, lower penalties = good = green.
 * Revenue percentage: (value / revenueTotal * 100) with "от выручки".
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md -- Story 65.12
 */

'use client'

import { AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison, type TrendDirection } from '@/lib/comparison-helpers'
import { StandardMetricSkeleton } from './MetricCardStates'

/** Format revenue percentage in Russian locale with 1 decimal */
function formatRevenuePct(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

const TREND_COLORS: Record<TrendDirection, string> = {
  positive: 'text-status-success',
  negative: 'text-status-error',
  neutral: 'text-muted-foreground',
}

const TREND_ICONS: Record<TrendDirection, typeof TrendingUp> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
}

export interface PenaltiesCardProps {
  /** Penalties amount from finance-summary (penalties_amount) */
  value: number | null
  /** Previous period penalties_amount for comparison */
  previousValue: number | null
  /** Total revenue (sales_gross_total) for percentage calculation */
  revenueTotal: number | null
  /** Loading state */
  isLoading: boolean
  /** Additional CSS classes */
  className?: string
}

function InlineTrend({ direction }: { direction: TrendDirection }) {
  const Icon = TREND_ICONS[direction]
  return (
    <Icon
      data-testid="trend-indicator"
      className={cn('h-3 w-3', TREND_COLORS[direction])}
      aria-hidden="true"
    />
  )
}

export function PenaltiesCard({
  value,
  previousValue,
  revenueTotal,
  isLoading,
  className,
}: PenaltiesCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />

  const hasValue = value != null
  const displayValue = hasValue ? formatCurrency(value) : '\u2014'

  // Inverted: increase in penalties = bad (negative/red)
  const comparison =
    value != null && previousValue != null ? calculateComparison(value, previousValue, true) : null

  const revenuePct =
    value != null && revenueTotal != null && revenueTotal > 0 ? (value / revenueTotal) * 100 : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Штрафы: ${hasValue ? formatCurrency(value) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-error" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground">Штрафы</span>
        </div>

        <div className="mt-1">
          <span className="text-xl font-bold text-status-error" data-testid="metric-value">
            {displayValue}
          </span>
        </div>

        {comparison && (
          <div className="mt-1 flex items-center gap-1.5">
            <InlineTrend direction={comparison.direction} />
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}

        {revenuePct != null && (
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">
              {formatRevenuePct(revenuePct)} от выручки
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
