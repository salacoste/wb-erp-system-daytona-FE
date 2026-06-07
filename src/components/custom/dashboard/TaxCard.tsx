/** TaxCard -- Story 66.5-FE: Backend tax metrics display (Epic 72 / Task-50) */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { StandardMetricSkeleton } from './MetricCardStates'
import { Header, Body } from './TaxCardHelpers'
import type { TaxMetrics } from '@/types/finance-summary'

export interface TaxCardProps {
  taxMetrics: TaxMetrics | null
  previousTaxMetrics: TaxMetrics | null
  isLoading: boolean
  className?: string
}

export function TaxCard({
  taxMetrics,
  previousTaxMetrics,
  isLoading,
  className,
}: TaxCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />

  const hasData = taxMetrics != null && taxMetrics.tax_amount != null
  const displayValue = hasData ? formatCurrency(taxMetrics.tax_amount!) : '—'

  // Inverted comparison: higher tax = negative (bad)
  const comparison =
    taxMetrics?.tax_amount != null && previousTaxMetrics?.tax_amount != null
      ? calculateComparison(taxMetrics.tax_amount, previousTaxMetrics.tax_amount, true)
      : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Налоги: ${hasData ? formatCurrency(taxMetrics!.tax_amount!) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <Header />
        <Body taxMetrics={taxMetrics} hasData={hasData} displayValue={displayValue} />
        {comparison && (
          <div className="mt-1 flex items-center gap-2">
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
            <span className="text-xs text-muted-foreground">
              vs {formatCurrency(previousTaxMetrics!.tax_amount!)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
