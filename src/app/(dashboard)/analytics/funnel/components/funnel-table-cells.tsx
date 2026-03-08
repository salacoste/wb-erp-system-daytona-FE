/** Funnel table cell sub-components — extracted from FunnelTable.tsx for 200-line limit */

'use client'

import { ArrowUpDown } from 'lucide-react'
import type { FunnelParams } from '@/types/analytics-funnel'

export type FunnelSortField = NonNullable<FunnelParams['sort']>

export function ariaSort(
  field: FunnelSortField,
  currentSort: FunnelSortField,
  currentOrder: 'asc' | 'desc'
) {
  return field === currentSort ? (`${currentOrder}ending` as const) : ('none' as const)
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
      type="button"
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
