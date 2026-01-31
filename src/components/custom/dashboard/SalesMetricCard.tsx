/**
 * Sales Metric Card Component
 * Story 63.1-FE: Sales Metric Card (Vykypy)
 * Epic 63-FE: Dashboard Business Logic Completion
 *
 * Displays wb_sales_gross (actual seller revenue after WB commission).
 * CRITICAL: Use wb_sales_gross, NOT sales_gross (retail price).
 *
 * @see docs/stories/epic-63/story-63.1-fe-sales-metric-card.md
 */

'use client'

import { ShoppingBag, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface SalesMetricCardProps {
  /** Actual sales revenue (wb_sales_gross) - CRITICAL: use this, not sales_gross */
  salesGross: number | null | undefined
  /** Previous period sales for comparison */
  previousSalesGross: number | null | undefined
  /** Returns amount for net sales calculation */
  returnsGross?: number | null
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: Error | null
  /** Retry callback */
  onRetry?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Sales Metric Card (Vykypy)
 *
 * Displays actual seller revenue with:
 * - Green color theme indicating positive revenue
 * - Period comparison with percentage change
 * - Net sales subtitle (after returns)
 * - Info tooltip explaining wb_sales_gross vs orders
 */
export function SalesMetricCard({
  salesGross,
  previousSalesGross,
  returnsGross,
  isLoading = false,
  error,
  onRetry,
  className,
}: SalesMetricCardProps): React.ReactElement {
  // Loading state
  if (isLoading) {
    return <StandardMetricSkeleton className={className} />
  }

  // Error state
  if (error) {
    return (
      <MetricCardError
        title="Выкупы"
        icon={ShoppingBag}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  // Calculate comparison (standard - higher is better for revenue)
  const comparison =
    salesGross != null && previousSalesGross != null && previousSalesGross !== 0
      ? calculateComparison(salesGross, previousSalesGross, false)
      : null

  // Calculate net sales after returns
  const netSales = salesGross != null && returnsGross != null ? salesGross - returnsGross : null

  // Format display value
  const hasValue = salesGross != null
  const displayValue = hasValue ? formatCurrency(salesGross) : '—'
  const ariaValue = hasValue ? `Выкупы: ${displayValue}` : 'Выкупы: нет данных'

  return (
    <Card
      className={cn(
        'min-h-[120px] transition-all hover:shadow-md hover:scale-[1.01]',
        'border border-[#EEEEEE] rounded-lg',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        className
      )}
      role="article"
      aria-label={ariaValue}
    >
      <CardContent className="p-4">
        {/* Header: Icon + Title + Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-green-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Выкупы</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Подробнее о метрике Выкупы"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>
                Фактическая выручка продавца после комиссии WB. Отличается от суммы заказов, так как
                включает только выкупленные товары.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main Value - Green for revenue */}
        <div className="mt-2">
          <span className="text-[32px] font-bold leading-tight text-green-500">{displayValue}</span>
        </div>

        {/* Comparison Row */}
        {comparison && (
          <div className="mt-2 flex items-center gap-1.5">
            <TrendIndicator direction={comparison.direction} size="sm" />
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
            <span className="text-xs text-muted-foreground">
              vs {formatCurrency(previousSalesGross ?? 0)}
            </span>
          </div>
        )}

        {/* Net sales subtitle (after returns) */}
        {netSales != null && returnsGross != null && (
          <div className="mt-1">
            <span className="text-xs text-gray-400">
              Чистая сумма (после возвратов): {formatCurrency(netSales)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
