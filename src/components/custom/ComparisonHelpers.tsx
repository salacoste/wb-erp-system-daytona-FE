/**
 * Comparison Summary Helpers
 * Extracted from SummaryComparison.tsx for file-size compliance.
 * Story 6.2-FE: Period Comparison Enhancement (DEFER-002)
 */

'use client'

import { cn, formatPercentage } from '@/lib/utils'
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
 * Format currency value in Russian locale
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Calculate delta between two values
 */
export function calculateDelta(
  current: number,
  compare: number
): { value: number; percent: number } {
  const delta = current - compare
  const percent = compare !== 0 ? (delta / Math.abs(compare)) * 100 : 0
  return { value: delta, percent }
}

/**
 * Delta indicator component
 */
export function DeltaDisplay({
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

  const colorClass = isNeutral ? 'text-gray-500' : isGood ? 'text-green-600' : 'text-red-600'

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
        ({percent >= 0 ? '+' : ''}
        {formatPercentage(percent, 1)})
      </span>
    </div>
  )
}
