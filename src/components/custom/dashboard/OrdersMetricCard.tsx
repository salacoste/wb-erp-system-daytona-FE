/**
 * Orders Volume Metric Card Component
 * Story 62.2-FE: Orders Volume Metric Card
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Displays orders volume metric with comparison and order count.
 * Uses blue color to indicate potential/pending revenue.
 *
 * @see docs/stories/epic-62/story-62.2-fe-orders-volume-metric-card.md
 */

'use client'

import { ShoppingCart, Info, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { MetricCardSkeleton } from './DashboardMetricsGridSkeleton'

export interface OrdersMetricCardProps {
  /** Total order amount in RUB */
  totalAmount: number | null | undefined
  /** Total number of orders */
  totalOrders: number | null | undefined
  /** Previous period order amount for comparison */
  previousAmount: number | null | undefined
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: Error | null
  /** Additional CSS classes */
  className?: string
  /** Retry callback for error state */
  onRetry?: () => void
}

/**
 * Format number with Russian locale
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

/**
 * Russian plural form for "заказ" (order)
 * @param count - Number of orders
 * @returns Correctly pluralized string
 */
function pluralizeOrders(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${formatNumber(count)} заказов`
  }
  if (lastDigit === 1) {
    return `${formatNumber(count)} заказ`
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${formatNumber(count)} заказа`
  }
  return `${formatNumber(count)} заказов`
}

/**
 * Orders Volume Metric Card
 *
 * Displays the total order amount as potential revenue with:
 * - Blue color theme indicating pending/potential status
 * - Period comparison with percentage change
 * - Order count subtitle
 * - Info tooltip explaining the metric
 */
export function OrdersMetricCard({
  totalAmount,
  totalOrders,
  previousAmount,
  isLoading = false,
  error,
  className,
  onRetry,
}: OrdersMetricCardProps): React.ReactElement {
  // Loading state
  if (isLoading) {
    return <MetricCardSkeleton className={className} />
  }

  // Error state
  if (error) {
    return (
      <Card
        className={cn('min-h-[120px]', className)}
        role="article"
        aria-label="Ошибка загрузки заказов"
      >
        <CardContent className="flex h-full flex-col items-center justify-center p-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="mt-2 text-sm text-muted-foreground">Ошибка загрузки</p>
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

  // Calculate comparison
  const comparison =
    totalAmount != null && previousAmount != null
      ? calculateComparison(totalAmount, previousAmount, false)
      : null

  // Format display value
  const displayValue = totalAmount != null ? formatCurrency(totalAmount) : '—'
  const ariaValue = totalAmount != null ? `Заказы: ${displayValue}` : 'Заказы: нет данных'

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
            <ShoppingCart className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Заказы</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Подробнее о метрике Заказы"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>Потенциальный доход от заказов. Включает отменённые и невыкупленные заказы.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main Value - Blue to indicate potential/pending */}
        <div className="mt-2">
          <span className="text-[32px] font-bold leading-tight text-blue-500">{displayValue}</span>
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
              vs {formatCurrency(previousAmount ?? 0)}
            </span>
          </div>
        )}

        {/* Subtitle: Order count */}
        <div className="mt-1">
          <span className="text-xs text-gray-400">
            {totalOrders != null ? pluralizeOrders(totalOrders) : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
