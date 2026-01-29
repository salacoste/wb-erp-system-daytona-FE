/**
 * Trends Summary Cards Component
 * Story 51.5-FE: Trends Summary Cards
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Displays 4 key metrics from FBS trends data in a responsive grid:
 * - Total orders, Total revenue, Avg daily orders, Cancellation rate
 * Russian locale formatting, delta indicators, loading states.
 */

'use client'

import { ShoppingCart, Banknote, TrendingUp, XCircle } from 'lucide-react'
import { SummaryCard } from './SummaryCard'
import { formatNumber, formatPercentValue } from '@/lib/fbs-analytics-utils'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

/**
 * Summary data from FBS trends API
 */
export interface TrendsSummaryData {
  totalOrders: number
  totalRevenue: number
  avgDailyOrders: number
  cancellationRate: number
  returnRate?: number
  /** Optional delta values for period comparison */
  ordersDelta?: number
  revenueDelta?: number
  avgDailyDelta?: number
  cancellationDelta?: number
}

/**
 * Props for TrendsSummaryCards component
 */
export interface TrendsSummaryCardsProps {
  /** Summary data from trends API */
  data?: TrendsSummaryData | null
  /** Number of days in period (for subtitle) */
  periodDays?: number
  /** Loading state */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Russian period label based on days count
 */
function getPeriodLabel(days?: number): string {
  if (!days) return ''
  if (days === 7) return 'за неделю'
  if (days === 30) return 'за 30 дней'
  if (days === 90) return 'за 90 дней'
  if (days === 365) return 'за год'
  return `за ${days} дней`
}

/**
 * Get color class for cancellation rate based on thresholds
 */
function getCancellationColor(rate: number): 'green' | 'yellow' | 'red' {
  if (rate < 5) return 'green'
  if (rate <= 10) return 'yellow'
  return 'red'
}

/**
 * Format average daily orders (1 decimal if needed)
 */
function formatAvgDaily(value: number): string {
  if (Number.isInteger(value)) return formatNumber(value)
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
}

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

  // Handle empty/null data
  const summary: TrendsSummaryData = data ?? {
    totalOrders: 0,
    totalRevenue: 0,
    avgDailyOrders: 0,
    cancellationRate: 0,
  }

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
        deltaTooltip={
          summary.ordersDelta !== undefined
            ? `Изменение к предыдущему периоду: ${summary.ordersDelta > 0 ? '+' : ''}${summary.ordersDelta.toFixed(1)}%`
            : undefined
        }
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
        deltaTooltip={
          summary.revenueDelta !== undefined
            ? `Изменение к предыдущему периоду: ${summary.revenueDelta > 0 ? '+' : ''}${summary.revenueDelta.toFixed(1)}%`
            : undefined
        }
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
        deltaTooltip={
          summary.avgDailyDelta !== undefined
            ? `Изменение к предыдущему периоду: ${summary.avgDailyDelta > 0 ? '+' : ''}${summary.avgDailyDelta.toFixed(1)}%`
            : undefined
        }
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
        deltaTooltip={
          summary.cancellationDelta !== undefined
            ? `Изменение к предыдущему периоду: ${summary.cancellationDelta > 0 ? '+' : ''}${summary.cancellationDelta.toFixed(1)}%`
            : undefined
        }
        isLoading={isLoading}
        aria-label={`Процент отмен: ${formatPercentValue(summary.cancellationRate)}`}
      />
    </div>
  )
}
