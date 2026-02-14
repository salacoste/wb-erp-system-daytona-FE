/**
 * Orders Card — Секция 1: ВЫРУЧКА (левая)
 * Dashboard Restructuring: P&L Narrative
 *
 * Shows total order count (FBO+FBS) from fulfillment/summary.
 * Blue accent color. No revenue subtitle — fulfillment ordersRevenue
 * is retail price (total_price), not seller revenue.
 */

'use client'

import { ShoppingCart, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface OrdersCardProps {
  totalOrders: number | null | undefined
  previousOrders: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

const fmtNum = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v))

export function OrdersCard({
  totalOrders,
  previousOrders,
  isLoading = false,
  error,
  onRetry,
  className,
}: OrdersCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Заказы"
        icon={ShoppingCart}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const hasValue = totalOrders != null
  const display = hasValue ? `${fmtNum(totalOrders)} шт.` : '—'
  const comparison =
    totalOrders != null && previousOrders != null && previousOrders !== 0
      ? calculateComparison(totalOrders, previousOrders, false)
      : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Заказы: ${display}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Заказы</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о метрике Заказы"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>Общее количество заказов FBO и FBS за период.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-blue-600">{display}</span>
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
      </CardContent>
    </Card>
  )
}
