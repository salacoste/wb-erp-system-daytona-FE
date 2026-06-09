/**
 * Trends Summary Cards Component
 * Story 51.5-FE: Trends Summary Cards
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Displays 4 key metrics from FBS trends data in a responsive grid:
 * - Total orders, Total revenue, Avg daily orders, Cancellation rate
 * Russian locale formatting, delta indicators, loading states.
 * Sub-components: TrendsSummaryCardHelpers (types, formatters)
 */

'use client'

import { ShoppingCart, Banknote, TrendingUp, XCircle } from 'lucide-react'
import { SummaryCard } from './SummaryCard'
import { formatNumber, formatPercentValue } from '@/lib/fbs-analytics-utils'
import { formatCurrency, cn } from '@/lib/utils'
import {
  getPeriodLabel,
  getCancellationColor,
  formatAvgDaily,
  buildDeltaTooltip,
  DEFAULT_SUMMARY,
  type TrendsSummaryData,
  type TrendsSummaryCardsProps,
} from './TrendsSummaryCardHelpers'

export type { TrendsSummaryData, TrendsSummaryCardsProps }
export { buildDeltaTooltip }

// ============================================================================
// Component
// ============================================================================

/**
 * Trends Summary Cards - 4 metric cards in responsive grid
 *
 * @example
 * <TrendsSummaryCards
 *   data={trendsData.summary}
 *   periodDays={30}
 *   isLoading={isLoading}
 * />
 */
export function TrendsSummaryCards({
  data,
  periodDays,
  isLoading = false,
  className,
}: TrendsSummaryCardsProps) {
  const periodLabel = getPeriodLabel(periodDays)

  const summary: TrendsSummaryData = data ?? DEFAULT_SUMMARY

  return (
    <div
      className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}
      role="region"
      aria-label="Сводка показателей"
    >
      {/* Total Orders Card */}
      <SummaryCard
        title="Всего заказов"
        value={formatNumber(summary.totalOrders)}
        subtitle={periodLabel}
        icon={<ShoppingCart className="h-5 w-5" />}
        iconColor="blue"
        delta={summary.ordersDelta}
        deltaTooltip={buildDeltaTooltip(summary.ordersDelta)}
        isLoading={isLoading}
        aria-label={`Всего заказов: ${formatNumber(summary.totalOrders)} ${periodLabel}`}
      />

      {/* Total Revenue Card */}
      <SummaryCard
        title="Общая выручка"
        value={formatCurrency(summary.totalRevenue)}
        subtitle={periodLabel}
        icon={<Banknote className="h-5 w-5" />}
        iconColor="green"
        delta={summary.revenueDelta}
        deltaTooltip={buildDeltaTooltip(summary.revenueDelta)}
        isLoading={isLoading}
        aria-label={`Общая выручка: ${formatCurrency(summary.totalRevenue)} ${periodLabel}`}
      />

      {/* Avg Daily Orders Card */}
      <SummaryCard
        title="Среднее в день"
        value={formatAvgDaily(summary.avgDailyOrders)}
        subtitle="заказов"
        icon={<TrendingUp className="h-5 w-5" />}
        iconColor="purple"
        delta={summary.avgDailyDelta}
        deltaTooltip={buildDeltaTooltip(summary.avgDailyDelta)}
        isLoading={isLoading}
        aria-label={`Среднее в день: ${formatAvgDaily(summary.avgDailyOrders)} заказов`}
      />

      {/* Cancellation Rate Card */}
      <SummaryCard
        title="Процент отмен"
        value={formatPercentValue(summary.cancellationRate)}
        subtitle={periodLabel || 'от общего числа'}
        icon={<XCircle className="h-5 w-5" />}
        iconColor={getCancellationColor(summary.cancellationRate)}
        delta={summary.cancellationDelta}
        deltaInverse // Negative is good for cancellation rate
        deltaTooltip={buildDeltaTooltip(summary.cancellationDelta)}
        isLoading={isLoading}
        aria-label={`Процент отмен: ${formatPercentValue(summary.cancellationRate)}`}
      />
    </div>
  )
}
