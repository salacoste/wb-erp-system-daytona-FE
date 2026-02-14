/**
 * Payout Card — Секция 3: К ПЕРЕЧИСЛЕНИЮ (левая, АКЦЕНТ)
 * Dashboard Restructuring: P&L Narrative
 *
 * Shows payout_total — the amount WB will transfer to seller.
 * Highlighted card with accent border. Source: finance-summary.payout_total.
 */

'use client'

import { Banknote, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { HighlightedMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface PayoutCardProps {
  payoutTotal: number | null | undefined
  previousPayout: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function PayoutCard({
  payoutTotal,
  previousPayout,
  isLoading = false,
  error,
  onRetry,
  className,
}: PayoutCardProps): React.ReactElement {
  if (isLoading) return <HighlightedMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="К перечислению"
        icon={Banknote}
        error={error}
        onRetry={onRetry}
        className={className}
        minHeight="min-h-[140px]"
      />
    )
  }

  const hasValue = payoutTotal != null
  const displayValue = hasValue ? formatCurrency(payoutTotal) : '—'
  const comparison =
    payoutTotal != null && previousPayout != null && previousPayout !== 0
      ? calculateComparison(payoutTotal, previousPayout, false)
      : null

  return (
    <Card
      className={cn(
        'border-2 border-green-500 bg-gradient-to-br from-green-50 to-white',
        'transition-shadow hover:shadow-md',
        className
      )}
      role="article"
      aria-label={`К перечислению: ${displayValue}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">К перечислению</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о сумме к перечислению"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>Сумма, которую WB перечислит на ваш счёт после всех удержаний.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-3">
          <span className="text-4xl font-bold text-green-600">{displayValue}</span>
        </div>
        {comparison && (
          <div className="mt-2 flex items-center gap-1.5">
            <TrendIndicator direction={comparison.direction} size="sm" />
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}
        <div className="mt-1">
          <span className="text-xs text-gray-400">После всех удержаний WB</span>
        </div>
      </CardContent>
    </Card>
  )
}
