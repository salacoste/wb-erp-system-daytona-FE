/**
 * ExpenseChart configuration, colors, and sub-components
 * Extracted from ExpenseChart.tsx for file size compliance
 * Story 3.3: Expense Breakdown Visualization
 */

'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { ExpenseItem } from '@/hooks/useExpenses'

/**
 * Color palette for expense categories
 * 2025-12-13: Updated to match PnLWaterfall/Dashboard structure + Request #56 WB Services
 */
export const COLORS = [
  '#9C27B0', // Purple - Комиссия WB
  '#2196F3', // Blue - Логистика
  '#4CAF50', // Green - Хранение
  '#FF9800', // Orange - Платная приёмка
  '#E53935', // Red - Штрафы
  '#673AB7', // Deep Purple - Корректировка ВВ
  '#E91E63', // Pink - WB.Продвижение (Request #56)
  '#9575CD', // Light Purple - Джем (Request #56)
  '#78909C', // Blue Grey - Прочие сервисы WB (Request #56)
  '#607D8B', // Grey - Прочие корректировки
  '#00BCD4', // Cyan - Комиссия лояльности
  '#FF5722', // Deep Orange - Удержание баллов
  '#FFC107', // Amber - Эквайринг
]

/** Data source hints for specific expense categories */
export const DATA_SOURCE_HINTS: Record<string, string> = {
  Хранение: 'Из финотчёта WB',
  'WB.Продвижение': 'Удержания за продвижение из финотчёта WB',
}

/** Custom tooltip component for expense chart */
export function ExpenseChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ExpenseItem }>
}) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as ExpenseItem
    const sourceHint = DATA_SOURCE_HINTS[data.category]
    return (
      <div className="rounded-lg border bg-white p-3 shadow-md">
        <p className="font-semibold text-gray-900">{data.category}</p>
        <p className="text-sm text-gray-600">
          Сумма: <span className="font-medium">{formatCurrency(data.amount)}</span>
        </p>
        {data.percentage !== undefined && (
          <p className="text-sm text-gray-600">
            Доля: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
        )}
        {sourceHint && <p className="text-xs text-gray-400 mt-1 italic">{sourceHint}</p>}
      </div>
    )
  }
  return null
}

/** Shimmer skeleton component for expense chart loading state */
export function ExpenseChartSkeleton(): React.ReactElement {
  const barHeights = [0.65, 0.85, 0.45, 0.75, 0.55, 0.9, 0.35]

  return (
    <Card aria-busy="true">
      <CardHeader>
        <Skeleton className="h-5 w-32" aria-hidden="true" />
        <Skeleton className="h-4 w-48 mt-1" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-[300px] px-4">
          {barHeights.map((height, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-lg"
              style={{ height: `${height * 100}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="flex justify-between mt-4 px-4">
          {barHeights.map((_, i) => (
            <Skeleton key={i} className="h-3 w-12" aria-hidden="true" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
