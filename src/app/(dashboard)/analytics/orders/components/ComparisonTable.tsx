/**
 * Comparison Table Component
 * Story 51.8-FE: FBS Analytics Page (Tab Navigation & Integration)
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Displays comparison data between two periods with delta indicators.
 */

'use client'

import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber, formatPercentValue } from '@/lib/fbs-analytics-utils'
import type { CompareResponse } from '@/types/fbs-analytics'

interface ComparisonTableProps {
  data: CompareResponse
}

/** Delta indicator component */
function DeltaIndicator({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return (
      <span className="flex items-center text-muted-foreground">
        <Minus className="h-4 w-4 mr-1" />0{suffix}
      </span>
    )
  }

  const isPositive = value > 0
  return (
    <span className={cn('flex items-center', isPositive ? 'text-green-600' : 'text-red-500')}>
      {isPositive ? (
        <TrendingUp className="h-4 w-4 mr-1" />
      ) : (
        <TrendingDown className="h-4 w-4 mr-1" />
      )}
      {isPositive ? '+' : ''}
      {value.toFixed(1)}
      {suffix}
    </span>
  )
}

export function ComparisonTable({ data }: ComparisonTableProps) {
  return (
    <div className="space-y-6">
      {/* Period Labels */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Текущий период</p>
          <p className="font-medium">
            {format(new Date(data.period1.from), 'dd.MM.yyyy')} —{' '}
            {format(new Date(data.period1.to), 'dd.MM.yyyy')}
          </p>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Предыдущий период</p>
          <p className="font-medium">
            {format(new Date(data.period2.from), 'dd.MM.yyyy')} —{' '}
            {format(new Date(data.period2.to), 'dd.MM.yyyy')}
          </p>
        </div>
      </div>

      {/* Metrics Comparison Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Метрика</th>
              <th className="text-right px-4 py-3 font-medium">Текущий</th>
              <th className="text-right px-4 py-3 font-medium">Предыдущий</th>
              <th className="text-right px-4 py-3 font-medium">Изменение</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="px-4 py-3">Заказы</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatNumber(data.period1.ordersCount)}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatNumber(data.period2.ordersCount)}
              </td>
              <td className="px-4 py-3 text-right">
                <DeltaIndicator value={data.comparison.ordersChangePercent} suffix="%" />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">Выручка</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatNumber(data.period1.revenue)} ₽
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatNumber(data.period2.revenue)} ₽
              </td>
              <td className="px-4 py-3 text-right">
                <DeltaIndicator value={data.comparison.revenueChangePercent} suffix="%" />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">Средний чек</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatNumber(data.period1.avgOrderValue)} ₽
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatNumber(data.period2.avgOrderValue)} ₽
              </td>
              <td className="px-4 py-3 text-right">
                <DeltaIndicator value={data.comparison.avgOrderValueChangePercent} suffix="%" />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">Процент отмен</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatPercentValue(data.period1.cancellationRate)}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatPercentValue(data.period2.cancellationRate)}
              </td>
              <td className="px-4 py-3 text-right">
                <DeltaIndicator value={data.comparison.cancellationRateChange} suffix=" п.п." />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
