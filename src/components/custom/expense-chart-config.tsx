/**
 * ExpenseChart configuration, colors, tooltip, skeleton
 * Redesign: horizontal bars with business context (2026-03-31)
 */

'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { ExpenseItem } from '@/hooks/useExpenses'

/** Semantic color map by category key word */
const CATEGORY_COLORS: Record<string, string> = {
  Комиссия: '#E53935',
  Логистика: '#3B82F6',
  Продвижение: '#7C4DFF',
  Эквайринг: '#F59E0B',
  Хранение: '#14B8A6',
  Штрафы: '#DC2626',
  Джем: '#8B5CF6',
  лояльности: '#06B6D4',
}
const DEFAULT_COLOR = '#9CA3AF'

/** Get semantic color for a category name */
export function getCategoryColor(category: string): string {
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.includes(key)) return color
  }
  return DEFAULT_COLOR
}

export interface MergedExpenseItem extends ExpenseItem {
  /** Sub-items merged into "Прочее" */
  subItems?: ExpenseItem[]
}

/** Merge items < threshold% into "Прочее", keeping sub-items for tooltip */
export function mergeSmallCategories(items: ExpenseItem[], thresholdPct = 1): MergedExpenseItem[] {
  const main: MergedExpenseItem[] = []
  const others: ExpenseItem[] = []
  for (const item of items) {
    if ((item.percentage ?? 0) >= thresholdPct) {
      main.push(item)
    } else {
      others.push(item)
    }
  }
  if (others.length > 0) {
    const otherAmount = others.reduce((s, i) => s + i.amount, 0)
    const otherPct = others.reduce((s, i) => s + (i.percentage ?? 0), 0)
    main.push({ category: 'Прочее', amount: otherAmount, percentage: otherPct, subItems: others })
  }
  return main
}

/** Tooltip for horizontal bar hover — expands sub-items for "Прочее" */
export function ExpenseBarTooltip({
  active,
  payload,
  revenueShare,
  wowChange,
}: {
  active?: boolean
  payload?: Array<{ payload: MergedExpenseItem }>
  revenueShare?: number
  wowChange?: number
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border bg-white p-3 shadow-md min-w-[200px]">
      <p className="font-semibold text-gray-900 mb-1">{d.category}</p>
      <p className="text-sm text-gray-700">
        Сумма: <span className="font-medium">{formatCurrency(d.amount)}</span>
      </p>
      {d.percentage != null && (
        <p className="text-sm text-gray-500">
          Доля расходов: <span className="font-medium">{d.percentage.toFixed(1)}%</span>
        </p>
      )}
      {revenueShare != null && (
        <p className="text-sm text-gray-500">
          % от выручки:{' '}
          <span className="font-medium">
            {d.percentage != null && d.percentage > 0
              ? ((revenueShare * (d.percentage / 100)) / d.percentage).toFixed(1)
              : '—'}
            %
          </span>
        </p>
      )}
      {wowChange != null && (
        <p className="text-sm text-gray-500">
          Нedel к нед.:{' '}
          <span className={`font-medium ${wowChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {wowChange > 0 ? '+' : ''}
            {wowChange.toFixed(1)}%
          </span>
        </p>
      )}
      {d.subItems && d.subItems.length > 0 && (
        <div className="mt-2 border-t pt-2 space-y-1">
          <p className="text-xs font-medium text-gray-500">Включает:</p>
          {d.subItems.map(sub => (
            <p key={sub.category} className="text-xs text-gray-600 flex justify-between gap-4">
              <span>{sub.category}</span>
              <span className="font-medium">{formatCurrency(sub.amount)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/** Skeleton for loading state */
export function ExpenseChartSkeleton(): React.ReactElement {
  return (
    <Card aria-busy="true">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-4 mt-3">
          <Skeleton className="h-12 w-28" />
          <Skeleton className="h-12 w-28" />
        </div>
      </CardHeader>
      <CardContent>
        {[0.9, 0.6, 0.35, 0.2, 0.12, 0.05].map((w, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 flex-1" style={{ maxWidth: `${w * 100}%` }} />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
