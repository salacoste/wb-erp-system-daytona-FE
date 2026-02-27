/**
 * LogisticsMetricCard Component for Story 62.5-FE
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Displays logistics cost (Логистика) with inverted comparison logic.
 * Data source: useFinancialSummary hook -> logistics_cost
 *
 * @see docs/stories/epic-62/story-62.5-fe-expense-metrics-cards.md
 */

'use client'

import { Truck } from 'lucide-react'
import { ExpenseMetricCard } from './ExpenseMetricCard'

export interface LogisticsMetricCardProps {
  /** Logistics cost for current period */
  logisticsCost: number | null | undefined
  /** Logistics cost for previous period */
  previousLogisticsCost: number | null | undefined
  /** Total revenue for calculating cost as % of revenue */
  revenueTotal?: number | null
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
 *
 * @example
 * <LogisticsMetricCard
 *   logisticsCost={67890}
 *   previousLogisticsCost={66298}
 *   revenueTotal={1234567}
 *   isLoading={false}
 * />
 */
export function LogisticsMetricCard({
  logisticsCost,
  previousLogisticsCost,
  revenueTotal,
  isLoading,
  error,
  className,
  onRetry,
}: LogisticsMetricCardProps): React.ReactElement {
  return (
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
      className={className}
      onRetry={onRetry}
    />
  )
}
