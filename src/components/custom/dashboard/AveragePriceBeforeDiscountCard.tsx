/**
 * AveragePriceBeforeDiscountCard -- Story 65.15: Average Price Before Discount
 *
 * Shows the average retail price before marketplace discount.
 * Formula: avg_price_before_discount = retail_price_total / salesCount
 * where salesCount = fbo.salesCount + fbs.salesCount (buyouts, NOT orders)
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

'use client'

import { Tag } from 'lucide-react'
import { BaseMetricCard } from '@/components/custom/dashboard/BaseMetricCard'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface AveragePriceBeforeDiscountCardProps {
  /** Sum of retail_price where doc_type='sale' */
  retailPriceTotal: number | null
  /** Total buyout count (fbo.salesCount + fbs.salesCount) */
  salesCount: number | null
  /** Previous period average for comparison */
  previousValue: number | null
  /** Whether data is still loading */
  isLoading: boolean
  /** Optional error */
  error?: Error | null
  /** Retry handler */
  onRetry?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Calculate average price before discount.
 * Guards against division by zero and null inputs.
 */
function calculateAveragePrice(
  retailPriceTotal: number | null,
  salesCount: number | null
): number | null {
  if (retailPriceTotal == null || salesCount == null) return null
  if (salesCount === 0) return null
  return retailPriceTotal / salesCount
}

export function AveragePriceBeforeDiscountCard({
  retailPriceTotal,
  salesCount,
  previousValue,
  isLoading,
  error,
  onRetry,
  className,
}: AveragePriceBeforeDiscountCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card
        className={cn('min-h-[100px]', className)}
        role="article"
        aria-busy="true"
        data-testid="avg-price-skeleton"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="mt-1 h-7 w-32" />
          <Skeleton className="mt-1 h-4 w-24" />
        </CardContent>
      </Card>
    )
  }

  const averagePrice = calculateAveragePrice(retailPriceTotal, salesCount)

  return (
    <BaseMetricCard
      title="Ср. цена до скидок"
      tooltip="Средняя розничная цена до скидки маркетплейса. Формула: сумма розничных цен / количество выкупов."
      icon={Tag}
      accentColor="text-status-warning"
      value={averagePrice}
      previousValue={previousValue}
      format="currency"
      inverted={false}
      isLoading={false}
      error={error}
      onRetry={onRetry}
      className={className}
    />
  )
}
