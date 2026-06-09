'use client'

import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatPercentage } from '@/lib/unit-economics-utils'

/**
 * Unit Economics Table Utilities
 * Story 5.2: Unit Economics Page Structure
 *
 * Constants, helpers, and sub-components extracted from UnitEconomicsTable.
 */

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const

/** Margin trend indicator: >= 20% green up, < 10% red down, otherwise neutral. Null margin → neutral. */
export function MarginIndicator({ value }: { value: number | null }) {
  // null (unknown margin: no COGS / zero revenue) → neutral, never green/red (anti-pattern #8 / rule 2).
  if (value != null && value >= 20) {
    return <TrendingUp className="h-4 w-4 text-green-500" />
  }
  if (value != null && value < 10) {
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

/** Sort icon for column headers. Active column shows direction; inactive is gray. */
export function getSortIcon(field: string, sortBy: string, sortOrder: 'asc' | 'desc') {
  if (sortBy !== field) {
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
  }
  const Icon = sortOrder === 'asc' ? ArrowUp : ArrowDown
  return <Icon className={cn('ml-2 h-4 w-4', 'text-blue-500')} />
}

/** Cost percentage cell with threshold-based coloring. */
export function CostCell({
  value,
  highThreshold,
  medThreshold,
}: {
  value: number | null
  highThreshold: number
  medThreshold?: number
}) {
  const med = medThreshold ?? highThreshold
  // null (unknown cost %: no COGS) → neutral styling + "—" via formatPercentage (rules 1+2).
  return (
    <TableCell className="text-right">
      <span
        className={cn(
          value != null && value > highThreshold && 'text-red-600 font-medium',
          value != null && value > med && value <= highThreshold && 'text-orange-600',
          (value == null || value <= med) && 'text-muted-foreground'
        )}
      >
        {formatPercentage(value)}
      </span>
    </TableCell>
  )
}
