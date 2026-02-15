/**
 * BuyoutRateCard -- Story 65.1: Buyout Rate (Процент выкупа)
 *
 * Shows the percentage of orders that were bought out (not returned).
 * Formula: buyoutRate = (salesCount / ordersCount) * 100
 * Comparison uses percentage points (п.п.), NOT relative %.
 *
 * Color thresholds: green >= 80%, yellow >= 60%, red < 60%.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md
 */

'use client'

import { ShoppingBag } from 'lucide-react'
import { BaseMetricCard } from '@/components/custom/dashboard/BaseMetricCard'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface BuyoutRateCardProps {
  salesCount: number | undefined
  ordersCount: number | undefined
  previousSalesCount?: number | undefined
  previousOrdersCount?: number | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

/** Calculate buyout rate percentage, guarding against division by zero */
function calculateBuyoutRate(
  salesCount: number | undefined,
  ordersCount: number | undefined
): number | null {
  if (salesCount == null || ordersCount == null) return null
  if (ordersCount === 0) return null
  return (salesCount / ordersCount) * 100
}

/** Color class for the main value based on buyout rate thresholds */
function getValueColor(rate: number): string {
  if (rate >= 80) return 'text-green-600'
  if (rate >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

/** Format percentage point difference with sign and Russian locale */
function formatPp(diff: number): string {
  const sign = diff > 0 ? '+' : ''
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(diff))
  return `${sign}${diff < 0 ? '-' : ''}${formatted} п.п.`
}

/** Color class for the pp comparison */
function getPpColor(diff: number): string {
  if (diff > 0) return 'text-green-600'
  if (diff < 0) return 'text-red-600'
  return 'text-gray-500'
}

export function BuyoutRateCard({
  salesCount,
  ordersCount,
  previousSalesCount,
  previousOrdersCount,
  isLoading = false,
  error,
  onRetry,
  className,
}: BuyoutRateCardProps): React.ReactElement {
  // Handle loading with skeleton that has role="article" + aria-busy
  if (isLoading) {
    return (
      <Card
        className={cn('min-h-[120px]', className)}
        role="article"
        aria-busy="true"
        data-testid="buyout-rate-skeleton"
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="mt-2 h-8 w-32" />
          <Skeleton className="mt-2 h-5 w-24" />
        </CardContent>
      </Card>
    )
  }

  const currentRate = calculateBuyoutRate(salesCount, ordersCount)
  const previousRate = calculateBuyoutRate(previousSalesCount, previousOrdersCount)

  // pp difference for comparison (percentage points, not relative %)
  const ppDiff = currentRate != null && previousRate != null ? currentRate - previousRate : null

  // Build the pp subtitle element for the BaseMetricCard slot
  const ppSubtitle =
    ppDiff != null ? (
      <span className={cn('text-sm font-medium', getPpColor(ppDiff))}>{formatPp(ppDiff)}</span>
    ) : null

  return (
    <BaseMetricCard
      title="Процент выкупа"
      tooltip="Доля заказов, которые были выкуплены покупателями (не возвращены). Формула: выкупы / заказы * 100%."
      icon={ShoppingBag}
      accentColor="text-blue-500"
      value={currentRate}
      format="percent"
      inverted={false}
      valueColor={currentRate != null ? getValueColor(currentRate) : undefined}
      subtitle={ppSubtitle}
      isLoading={false}
      error={error}
      onRetry={onRetry}
      className={className}
    />
  )
}
