/** Funnel table cell sub-components — extracted from FunnelTable.tsx for 200-line limit */

'use client'

import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="ml-auto min-h-11 min-w-11 px-2 text-inherit hover:bg-transparent hover:text-foreground"
    >
      {children}
      <ArrowUpDown
        className={`h-3.5 w-3.5 ${active ? 'text-foreground' : 'text-muted-foreground/50'}`}
      />
    </Button>
  )
}
