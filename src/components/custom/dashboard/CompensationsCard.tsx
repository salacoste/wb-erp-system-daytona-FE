/**
 * CompensationsCard -- Story 65.12: Compensations Card (Компенсации)
 *
 * Shows corrections_amount (monetary value) with direct comparison logic.
 * Higher compensations = good = green, lower compensations = bad = red.
 * Revenue percentage: (value / revenueTotal * 100) with "от выручки".
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md -- Story 65.12
 */

'use client'

import { ShieldCheck, TrendingDown, TrendingUp, Minus } from 'lucide-react'
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

export interface CompensationsCardProps {
  /** Compensations amount from finance-summary (corrections_amount) */
  value: number | null
  /** Previous period corrections_amount for comparison */
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

export function CompensationsCard({
  value,
  previousValue,
  revenueTotal,
  isLoading,
  className,
}: CompensationsCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />

  const hasValue = value != null
  const displayValue = hasValue ? formatCurrency(value) : '\u2014'

  // Direct: increase in compensations = good (positive/green)
  const comparison =
    value != null && previousValue != null ? calculateComparison(value, previousValue, false) : null

  const revenuePct =
    value != null && revenueTotal != null && revenueTotal > 0 ? (value / revenueTotal) * 100 : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Компенсации: ${hasValue ? formatCurrency(value) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-status-success" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground">Компенсации</span>
        </div>

        <div className="mt-1">
          <span className="text-xl font-bold text-status-success" data-testid="metric-value">
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
