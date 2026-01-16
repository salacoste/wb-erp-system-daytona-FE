/**
 * Summary Comparison Component
 * Story 6.2-FE: Period Comparison Enhancement (DEFER-002)
 *
 * Displays comparison summary with delta indicators for table footers.
 */

'use client'

import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

/**
 * Summary totals for a period
 */
export interface PeriodTotals {
  /** Total revenue for period */
  totalRevenue: number
  /** Total profit for period */
  totalProfit: number
  /** Average margin percentage */
  avgMargin: number | null
  /** Number of items */
  itemCount: number
}

/**
 * Comparison summary props
 */
export interface ComparisonSummaryProps {
  /** Current period totals */
  current: PeriodTotals
  /** Comparison period totals (optional) */
  compare?: PeriodTotals | null
  /** Additional CSS classes */
  className?: string
}

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Calculate delta between two values
 */
function calculateDelta(current: number, compare: number): { value: number; percent: number } {
  const delta = current - compare
  const percent = compare !== 0 ? (delta / Math.abs(compare)) * 100 : 0
  return { value: delta, percent }
}

/**
 * Delta indicator component
 */
function DeltaDisplay({
  value,
  percent,
  inverse = false,
  type = 'currency',
}: {
  value: number
  percent: number
  inverse?: boolean
  type?: 'currency' | 'percent'
}) {
  // Determine if positive is good (or inverse for costs)
  const isPositive = value > 0
  const isGood = inverse ? !isPositive : isPositive
  const isNeutral = Math.abs(percent) < 0.5

  const colorClass = isNeutral
    ? 'text-gray-500'
    : isGood
    ? 'text-green-600'
    : 'text-red-600'

  const Icon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown

  return (
    <div className={cn('flex items-center gap-1 text-xs', colorClass)}>
      <Icon className="h-3 w-3" />
      <span>
        {type === 'currency'
          ? formatCurrency(Math.abs(value))
          : `${Math.abs(value).toFixed(1)} п.п.`}
      </span>
      <span className="text-gray-400">
        ({percent >= 0 ? '+' : ''}{percent.toFixed(1)}%)
      </span>
    </div>
  )
}

/**
 * Comparison Summary - displays period comparison with delta indicators
 *
 * Shows current period totals with optional comparison to previous period.
 * Displays revenue, profit, and margin with delta indicators.
 *
 * @example
 * <ComparisonSummary
 *   current={{ totalRevenue: 500000, totalProfit: 75000, avgMargin: 15, itemCount: 100 }}
 *   compare={{ totalRevenue: 450000, totalProfit: 60000, avgMargin: 13.3, itemCount: 95 }}
 * />
 */
export function ComparisonSummary({
  current,
  compare,
  className,
}: ComparisonSummaryProps) {
  const hasComparison = compare !== null && compare !== undefined

  // Calculate deltas if comparison available
  const revenueDelta = hasComparison
    ? calculateDelta(current.totalRevenue, compare.totalRevenue)
    : null
  const profitDelta = hasComparison
    ? calculateDelta(current.totalProfit, compare.totalProfit)
    : null
  const marginDelta = hasComparison && current.avgMargin !== null && compare.avgMargin !== null
    ? { value: current.avgMargin - compare.avgMargin, percent: 0 }
    : null

  return (
    <div className={cn('border-t bg-gray-50 p-4', className)}>
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {/* Item Count */}
        <div>
          <div className="text-gray-600">Всего позиций</div>
          <div className="text-lg font-semibold text-gray-900">
            {current.itemCount.toLocaleString('ru-RU')}
          </div>
          {hasComparison && compare.itemCount !== current.itemCount && (
            <div className="text-xs text-gray-500">
              vs {compare.itemCount.toLocaleString('ru-RU')}
            </div>
          )}
        </div>

        {/* Total Revenue */}
        <div>
          <div className="text-gray-600">Общая выручка</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(current.totalRevenue)}
          </div>
          {revenueDelta && (
            <DeltaDisplay
              value={revenueDelta.value}
              percent={revenueDelta.percent}
              type="currency"
            />
          )}
        </div>

        {/* Total Profit */}
        <div>
          <div className="text-gray-600">Общая прибыль</div>
          <div className={cn(
            'text-lg font-semibold',
            current.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(current.totalProfit)}
          </div>
          {profitDelta && (
            <DeltaDisplay
              value={profitDelta.value}
              percent={profitDelta.percent}
              type="currency"
            />
          )}
        </div>

        {/* Average Margin */}
        <div>
          <div className="text-gray-600">Средняя маржа</div>
          <div className="text-lg font-semibold text-gray-900">
            {current.avgMargin !== null ? `${current.avgMargin.toFixed(2)}%` : '—'}
          </div>
          {marginDelta && (
            <DeltaDisplay
              value={marginDelta.value}
              percent={0}
              type="percent"
            />
          )}
        </div>
      </div>
    </div>
  )
}
