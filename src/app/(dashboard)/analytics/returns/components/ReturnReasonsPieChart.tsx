/**
 * Return Reasons Pie Chart
 * Epic 70-FE: Visual breakdown of 3 return categories
 */

'use client'

import { useReturnReasons } from '@/hooks/use-return-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { formatPercentage } from '@/lib/utils'
import type { ReturnCategoryItem } from '@/types/analytics-returns'

interface ReturnReasonsPieChartProps {
  from?: string
  to?: string
}

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

export function ReturnReasonsPieChart({ from, to }: ReturnReasonsPieChartProps) {
  const { data, isLoading, isError } = useReturnReasons(from, to)

  if (isLoading) return <Skeleton className="h-64 w-full" />

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить причины возвратов</AlertDescription>
      </Alert>
    )
  }

  const categories = data?.byCategory ?? []
  const total = data?.summary?.totalReturns ?? 0

  if (categories.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Нет данных о причинах возвратов</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Причины возвратов ({total.toLocaleString('ru-RU')})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Visual bar representation */}
          <div className="space-y-3">
            <StackedBar categories={categories} />
            <div className="space-y-2">
              {categories.map(cat => (
                <CategoryRow key={cat.category} item={cat} />
              ))}
            </div>
          </div>

          {/* Donut-style breakdown */}
          <div className="flex items-center justify-center">
            <DonutChart categories={categories} total={total} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StackedBar({ categories }: { categories: ReturnCategoryItem[] }) {
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

function CategoryRow({ item }: { item: ReturnCategoryItem }) {
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
  const arrow = isUp ? '\u2191' : '\u2193'

  return (
    <span className={`text-xs ${color}`}>
      {arrow}
      {/* Russian locale: comma decimal (was dot-locale toFixed). Bare pp delta — no "%"/unit,
          so the locale-percent gate doesn't track it; fixed here for same-row consistency. */}
      {Math.abs(delta).toLocaleString('ru-RU', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}
    </span>
  )
}

function DonutChart({ categories, total }: { categories: ReturnCategoryItem[]; total: number }) {
  // SVG donut chart
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

          const colorMap: Record<string, string> = {
            cancel_before_shipment: '#3B82F6',
            refusal_at_pvz: '#F97316',
            return_after_receipt: '#EF4444',
          }

          return (
            <circle
              key={cat.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colorMap[cat.category] ?? '#9CA3AF'}
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
