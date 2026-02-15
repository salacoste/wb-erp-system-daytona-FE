/**
 * ReturnsCard -- Story 65.5: Returns Card (Возвраты)
 *
 * Shows wb_returns_gross (monetary value) + returnsCount (quantity from fulfillment).
 * Comparison uses calculateComparison() with invertComparison=true (higher returns = worse).
 * Red accent, RotateCcw icon.
 *
 * Graceful degradation:
 * - returnsCount undefined (fulfillment unavailable) -> count shows "---"
 * - wbReturnsGross null -> value shows "---"
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md -- Story 65.5
 */

'use client'

import { RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BaseMetricCard } from '@/components/custom/dashboard/BaseMetricCard'

export interface ReturnsCardProps {
  /** Returns gross value from finance-summary (wb_returns_gross) */
  wbReturnsGross: number | null | undefined
  /** Returns count aggregated from fulfillment (fbo.returnsCount + fbs.returnsCount) */
  returnsCount: number | undefined
  /** Previous period wb_returns_gross for comparison */
  previousWbReturnsGross?: number | null | undefined
  /** Loading state */
  isLoading?: boolean
  /** Error object if fetch failed */
  error?: Error | null
  /** Retry callback for error state */
  onRetry?: () => void
  /** Additional CSS classes */
  className?: string
}

/** Format returnsCount as secondary value: "60 шт" or "---" when unavailable */
function formatCount(count: number | undefined): string {
  if (count == null) return '—'
  return `${new Intl.NumberFormat('ru-RU').format(count)} шт`
}

export function ReturnsCard({
  wbReturnsGross,
  returnsCount,
  previousWbReturnsGross,
  isLoading = false,
  error,
  onRetry,
  className,
}: ReturnsCardProps): React.ReactElement {
  // Custom loading skeleton with test ID for test compatibility
  if (isLoading) {
    return (
      <Card
        className={cn('min-h-[120px]', className)}
        role="article"
        aria-busy="true"
        data-testid="returns-card-skeleton"
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

  return (
    <BaseMetricCard
      title="Возвраты"
      tooltip="Сумма возвратов из еженедельного отчёта WB. Количество — агрегация FBO + FBS."
      icon={RotateCcw}
      accentColor="text-red-500"
      value={wbReturnsGross ?? null}
      previousValue={previousWbReturnsGross}
      format="currency"
      inverted={true}
      valueColor="text-red-500"
      secondaryValue={wbReturnsGross != null ? formatCount(returnsCount) : undefined}
      isLoading={false}
      error={error}
      onRetry={onRetry}
      className={className}
    />
  )
}
