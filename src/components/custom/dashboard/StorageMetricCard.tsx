/**
 * StorageMetricCard Component for Story 62.5-FE
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Displays storage cost (Хранение) with inverted comparison logic.
 * Data source: useFinancialSummary hook -> storage_cost
 *
 * @see docs/stories/epic-62/story-62.5-fe-expense-metrics-cards.md
 */

'use client'

import { Warehouse } from 'lucide-react'
import { ExpenseMetricCard } from './ExpenseMetricCard'

export interface StorageMetricCardProps {
  /** Storage cost for current period */
  storageCost: number | null | undefined
  /** Storage cost for previous period */
  previousStorageCost: number | null | undefined
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
 * Storage expense metric card
 *
 * Displays storage cost with:
 * - chart-2 categorical tone for value (storage domain accent)
 * - Warehouse icon
 * - Inverted comparison (decrease = success, increase = error)
 * - Cost as % of revenue subtitle
 *
 * @example
 * <StorageMetricCard
 *   storageCost={12345}
 *   previousStorageCost={10383}
 *   revenueTotal={1234567}
 *   isLoading={false}
 * />
 */
export function StorageMetricCard({
  storageCost,
  previousStorageCost,
  revenueTotal,
  isLoading,
  error,
  className,
  onRetry,
}: StorageMetricCardProps): React.ReactElement {
  return (
    <ExpenseMetricCard
      title="Хранение"
      tooltip="Расходы на хранение товаров на складах Wildberries за период.\n⚠ Это сумма начислений, не текущие остатки.\nТовар может быть уже продан, но начисление за период хранения остаётся.\nИсточник: недельный финансовый отчёт WB."
      icon={Warehouse}
      valueColor="text-chart-2"
      value={storageCost}
      previousValue={previousStorageCost}
      revenueTotal={revenueTotal}
      isLoading={isLoading}
      error={error}
      className={className}
      onRetry={onRetry}
    />
  )
}
