/** Buyout table cell sub-components — extracted from BuyoutTable.tsx for 200-line limit */

'use client'

import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { TableCell } from '@/components/ui/table'
import type {
  BuyoutBySkuParams,
  TrendDirection,
  BuyoutConfidence,
} from '@/types/analytics-epics-68-71'

export type SortField = NonNullable<BuyoutBySkuParams['sort']>

export function ariaSort(field: SortField, currentSort: SortField, order: 'asc' | 'desc') {
  return field === currentSort ? (`${order}ending` as const) : ('none' as const)
}

export function ReasonCell({ count, color }: { count?: number; color: string }) {
  if (!count) return <TableCell className="text-muted-foreground">—</TableCell>
  return <TableCell className={`font-medium ${color}`}>{count}</TableCell>
}

export function TrendIndicator({ trend, delta }: { trend?: TrendDirection; delta?: number }) {
  if (!trend || trend === 'stable') {
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const isDown = trend === 'down'
  const Icon = isDown ? TrendingDown : TrendingUp
  const color = isDown ? 'text-red-500' : 'text-green-500'
  const sign = isDown ? '' : '+'

  return (
    <span className={`flex items-center gap-1 text-sm ${color}`}>
      <Icon className="h-4 w-4" />
      {delta != null && (
        <span>
          {sign}
          {delta.toFixed(1)}
        </span>
      )}
    </span>
  )
}

export function ConfidenceBadge({ confidence }: { confidence?: BuyoutConfidence }) {
  if (!confidence || confidence === 'high') return null

  if (confidence === 'medium') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
        Мало данных
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700">
      Недостаточно данных
    </span>
  )
}

export function SortBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown
        className={`h-3.5 w-3.5 ${active ? 'text-foreground' : 'text-muted-foreground/50'}`}
      />
    </button>
  )
}
