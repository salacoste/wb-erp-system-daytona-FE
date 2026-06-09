/**
 * Return Reasons Chart - Sub-components (StackedBar, CategoryRow, TrendBadge, DonutChart)
 * Extracted from ReturnReasonsPieChart.tsx for file size compliance
 */

'use client'

import { formatPercentage } from '@/lib/utils'
import type { ReturnCategoryItem } from '@/types/analytics-returns'

const CATEGORY_COLORS: Record<string, string> = {
  cancel_before_shipment: 'bg-blue-500',
  refusal_at_pvz: 'bg-orange-500',
  return_after_receipt: 'bg-red-500',
}

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  cancel_before_shipment: 'text-blue-600',
  refusal_at_pvz: 'text-orange-600',
  return_after_receipt: 'text-red-600',
}

export function StackedBar({ categories }: { categories: ReturnCategoryItem[] }) {
  return (
    <div className="flex h-6 rounded-full overflow-hidden">
      {categories.map(cat => (
        <div
          key={cat.category}
          className={`${CATEGORY_COLORS[cat.category] ?? 'bg-gray-400'} transition-all`}
          style={{ width: `${Math.max(cat.percentage, 1)}%` }}
          title={`${cat.displayName}: ${formatPercentage(cat.percentage, 1)}`}
        />
      ))}
    </div>
  )
}

export function CategoryRow({ item }: { item: ReturnCategoryItem }) {
  const color = CATEGORY_COLORS[item.category] ?? 'bg-gray-400'
  const textColor = CATEGORY_TEXT_COLORS[item.category] ?? 'text-gray-600'

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-sm ${color}`} />
        <span>{item.displayName}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-medium ${textColor}`}>{formatPercentage(item.percentage, 1)}</span>
        <span className="text-muted-foreground">({item.count})</span>
        <TrendBadge trend={item.trend} delta={item.trendDelta} />
      </div>
    </div>
  )
}

function TrendBadge({ trend, delta }: { trend: string; delta: number }) {
  if (trend === 'stable') return null

  const isUp = trend === 'up'
  const color = isUp ? 'text-red-500' : 'text-green-500'
  const arrow = isUp ? '↑' : '↓'

  return (
    <span className={`text-xs ${color}`}>
      {arrow}
      {/* Russian locale: comma decimal. Bare pp delta — no "%"/unit. */}
      {Math.abs(delta).toLocaleString('ru-RU', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}
    </span>
  )
}

const DONUT_COLOR_MAP: Record<string, string> = {
  cancel_before_shipment: '#3B82F6',
  refusal_at_pvz: '#F97316',
  return_after_receipt: '#EF4444',
}

export function DonutChart({
  categories,
  total,
}: {
  categories: ReturnCategoryItem[]
  total: number
}) {
  const size = 160
  const strokeWidth = 32
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let cumulativeOffset = 0

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {categories.map(cat => {
          const pct = cat.percentage / 100
          const dashLength = pct * circumference
          const offset = cumulativeOffset
          cumulativeOffset += dashLength

          return (
            <circle
              key={cat.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={DONUT_COLOR_MAP[cat.category] ?? '#9CA3AF'}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{total}</span>
        <span className="text-xs text-muted-foreground">возвратов</span>
      </div>
    </div>
  )
}
