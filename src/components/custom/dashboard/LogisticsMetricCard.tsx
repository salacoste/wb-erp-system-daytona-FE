/**
 * LogisticsMetricCard Component for Story 62.5-FE
 * Epic 62-FE: Dashboard UI/UX Presentation
 * Story 65.6: Added logistics breakdown popover
 *
 * Displays logistics cost (Логистика) with inverted comparison logic.
 * Data source: useFinancialSummary hook -> logistics_cost
 *
 * @see docs/stories/epic-62/story-62.5-fe-expense-metrics-cards.md
 */

'use client'

import { Truck } from 'lucide-react'
import type { LogisticsBreakdown } from '@/types/finance-summary'
import { cn } from '@/lib/utils'
import { ExpenseMetricCard } from './ExpenseMetricCard'
import { LogisticsBreakdownPopover } from './LogisticsBreakdownPopover'

export interface LogisticsMetricCardProps {
  /** Logistics cost for current period */
  logisticsCost: number | null | undefined
  /** Logistics cost for previous period */
  previousLogisticsCost: number | null | undefined
  /** Total revenue for calculating cost as % of revenue */
  revenueTotal?: number | null
  /** Story 65.6: Logistics breakdown by delivery type */
  logisticsBreakdown?: LogisticsBreakdown | null
  /** Loading state */
  isLoading?: boolean
  /** Error object if fetch failed */
  error?: Error | null
  /** Additional CSS classes */
  className?: string
  /** Retry callback for error state */
  onRetry?: () => void
}

/**
 * Logistics expense metric card
 *
 * Displays logistics cost with:
 * - Red color (#EF4444) for value
 * - Truck icon
 * - Inverted comparison (decrease = green, increase = red)
 * - Cost as % of revenue subtitle
 * - Story 65.6: Breakdown popover when logistics_breakdown data available
 */
// story-65.6: logistics breakdown
export function LogisticsMetricCard({
  logisticsCost,
  previousLogisticsCost,
  revenueTotal,
  logisticsBreakdown,
  isLoading,
  error,
  className,
  onRetry,
}: LogisticsMetricCardProps): React.ReactElement {
  return (
    <div className="relative h-full">
      <ExpenseMetricCard
        title="Логистика"
        tooltip={
          'Расходы на логистику WB: доставка товаров покупателям, обратная логистика при возвратах, перемещения между складами.\nЧем больше возвратов — тем выше логистика (платите за доставку в обе стороны).\nИсточник: еженедельный финансовый отчёт WB.'
        }
        icon={Truck}
        valueColor="text-red-500"
        value={logisticsCost}
        previousValue={previousLogisticsCost}
        revenueTotal={revenueTotal}
        isLoading={isLoading}
        error={error}
        className={cn('h-full', className)}
        onRetry={onRetry}
      />
      {logisticsBreakdown && (
        <div className="absolute right-3 top-3" data-testid="logistics-breakdown-wrapper">
          <LogisticsBreakdownPopover breakdown={logisticsBreakdown} saleGross={revenueTotal} />
        </div>
      )}
    </div>
  )
}
