/**
 * BuyoutRateCard -- Epic 69, Story 69.7: Frontend Buyout Rate Formula Fix
 *
 * Shows the percentage of orders that were bought out (not returned).
 *
 * FIXED (P-005): Previously used salesCount/ordersCount*100 (WRONG).
 * Now uses pre-calculated buyoutRate from backend API:
 *   Primary: GET /v1/analytics/buyout/summary -> overallBuyoutRatePct
 *   Fallback: GET /v1/analytics/fbs/enhanced -> orderStats.buyoutRate
 *
 * Unified formula (Story 69.1): buyout_rate = (sales - returns) / sales * 100
 * @see docs/stories/epic-69/story-69.7-frontend-formula-fix.md
 * @see src/analytics/utils/buyout-formula.ts
 *
 * Color thresholds (AC-69.7.3):
 *   - null/undefined -> "Нет данных" (gray)
 *   - >= 80% -> green (healthy)
 *   - < 80% -> red (warning)
 *   - 100% -> green (perfect)
 *
 * Comparison uses percentage points (п.п.), NOT relative %.
 */

'use client'

import { ShoppingBag } from 'lucide-react'
import { BaseMetricCard } from '@/components/custom/dashboard/BaseMetricCard'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Epic 69, Story 69.7: Updated props interface.
 * Primary prop: buyoutRate (pre-calculated by backend).
 */
export interface BuyoutRateCardProps {
  /** Pre-calculated buyout rate from backend API (0-100 or null) */
  buyoutRate?: number | null | undefined
  /** Previous period buyout rate for comparison (0-100 or null) */
  previousBuyoutRate?: number | null | undefined
  /** Total buyout count for tooltip detail */
  buyoutCount?: number | null
  /** Total orders count for tooltip detail */
  totalOrders?: number | null
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

/**
 * Color class for the main value based on buyout rate thresholds.
 * Epic 69, AC-69.7.3: >= 80% green, < 80% red warning.
 */
function getValueColor(rate: number): string {
  if (rate >= 80) return 'text-green-600'
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

/**
 * Build tooltip text with buyout details.
 * Epic 69, AC-69.7.2: "Выкуп: {N} из {M} заказов выкуплено. Данные за последние 30 дней."
 */
function buildTooltip(buyoutCount?: number | null, totalOrders?: number | null): string {
  if (buyoutCount != null && totalOrders != null && totalOrders > 0) {
    return `Выкуп: ${buyoutCount} из ${totalOrders} заказов выкуплено. Данные за последние 30 дней.`
  }
  // Epic 69: Unified formula reference in tooltip
  return 'Процент выкупа: (продажи - возвраты) / продажи * 100%. Данные за последние 30 дней.'
}

export function BuyoutRateCard({
  buyoutRate,
  previousBuyoutRate,
  buyoutCount,
  totalOrders,
  isLoading = false,
  error,
  onRetry,
  className,
}: BuyoutRateCardProps): React.ReactElement {
  // Handle loading with skeleton that has role="article" + aria-busy
  if (isLoading) {
    return (
      <Card
        className={cn('min-h-[100px]', className)}
        role="article"
        aria-busy="true"
        data-testid="buyout-rate-skeleton"
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

  // Use pre-calculated buyoutRate from backend (AC-69.7.1)
  const currentRate = buyoutRate ?? null
  const previousRate = previousBuyoutRate ?? null

  // pp difference for comparison (percentage points, not relative %)
  const ppDiff = currentRate != null && previousRate != null ? currentRate - previousRate : null

  // Build the pp subtitle element for the BaseMetricCard slot
  const ppSubtitle =
    ppDiff != null ? (
      <span className={cn('text-sm font-medium', getPpColor(ppDiff))}>{formatPp(ppDiff)}</span>
    ) : null

  // Epic 69, AC-69.7.2: Tooltip with buyout details
  const tooltip = buildTooltip(buyoutCount, totalOrders)

  return (
    <BaseMetricCard
      title="Процент выкупа"
      tooltip={tooltip}
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
