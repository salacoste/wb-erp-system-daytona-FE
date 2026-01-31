/**
 * AdvertisingMetricCard Component for Story 62.5-FE
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Displays advertising spend (Рекламные затраты) with inverted comparison logic.
 * Data source: useAdvertisingAnalytics hook -> summary.total_spend
 *
 * @see docs/stories/epic-62/story-62.5-fe-expense-metrics-cards.md
 */

'use client'

import { Megaphone } from 'lucide-react'
import { ExpenseMetricCard } from './ExpenseMetricCard'

export interface AdvertisingMetricCardProps {
  /** Total advertising spend for current period */
  totalSpend: number | null | undefined
  /** Total advertising spend for previous period */
  previousSpend: number | null | undefined
  /** Total revenue for calculating spend as % of revenue */
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
 * Advertising expense metric card
 *
 * Displays advertising spend with:
 * - Yellow/orange color (#F59E0B) for value
 * - Megaphone icon
 * - Inverted comparison (decrease = green, increase = red)
 * - Spend as % of revenue subtitle
 *
 * @example
 * <AdvertisingMetricCard
 *   totalSpend={45678}
 *   previousSpend={47123}
 *   revenueTotal={1234567}
 *   isLoading={false}
 * />
 */
export function AdvertisingMetricCard({
  totalSpend,
  previousSpend,
  revenueTotal,
  isLoading,
  error,
  className,
  onRetry,
}: AdvertisingMetricCardProps): React.ReactElement {
  return (
    <ExpenseMetricCard
      title="Рекламные затраты"
      tooltip="Общие расходы на рекламу в Wildberries за выбранный период."
      icon={Megaphone}
      valueColor="text-yellow-600"
      value={totalSpend}
      previousValue={previousSpend}
      revenueTotal={revenueTotal}
      isLoading={isLoading}
      error={error}
      className={className}
      onRetry={onRetry}
    />
  )
}
