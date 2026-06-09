/** Buyout table cell sub-components — extracted from BuyoutTable.tsx for 200-line limit */

'use client'

import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { TableCell } from '@/components/ui/table'
import type { BuyoutBySkuParams, TrendDirection, BuyoutConfidence } from '@/types/analytics-buyout'

export type SortField = NonNullable<BuyoutBySkuParams['sort']>

export function ariaSort(field: SortField, currentSort: SortField, order: 'asc' | 'desc') {
  return field === currentSort ? (`${order}ending` as const) : ('none' as const)
}

export function ReasonCell({
  count,
  color,
  estimated,
}: {
  count?: number
  color: string
  estimated?: boolean
}) {
  // FBO: categories unavailable, show indicator instead of misleading 0
  if (estimated)
    return (
      <TableCell className="text-muted-foreground" title="FBO — разбивка по категориям недоступна">
        ~
      </TableCell>
    )
  if (count == null) return <TableCell className="text-muted-foreground">—</TableCell>
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
          {/* ru-RU comma decimal (bare pp delta; unit is in the column header, custom sign above).
              toFixed(1) rendered dot-locale "5.3"; toLocaleString → "5,3". No NBSP (plain number;
              pp deltas are bounded ~0-100 so no thousands-grouping NBSP). Rounding shifts from
              toFixed's FP half-to-even to Intl halfExpand at .x5 (5.35→"5,4"): display-only, more
              correct — consistent with this session's percent migrations. */}
          {delta.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
      )}
    </span>
  )
}

export function ConfidenceBadge({ confidence }: { confidence?: BuyoutConfidence }) {
  if (!confidence || confidence === 'high') return null

  if (confidence === 'medium') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
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
