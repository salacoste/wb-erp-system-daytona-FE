'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { LiquidityUiSortField } from '@/lib/liquidity-utils'

// Single source of truth lives in liquidity-sort.ts; alias preserves this module's consumer name.
export type LiquiditySortField = LiquidityUiSortField

interface LiquidityTableHeaderProps {
  sortBy: LiquiditySortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: LiquiditySortField) => void
}

/** aria-sort value per WAI-ARIA (funnel funnel-table-columns canon, 169.10). */
function ariaSort(
  field: LiquiditySortField,
  currentSort: LiquiditySortField,
  currentOrder: 'asc' | 'desc'
): 'ascending' | 'descending' | 'none' {
  return field === currentSort ? (`${currentOrder}ending` as const) : 'none'
}

/** Keyboard-accessible sort control (button, not a clickable <th>). */
function SortHead({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string
  field: LiquiditySortField
  sortBy: LiquiditySortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: LiquiditySortField) => void
}) {
  const active = sortBy === field
  return (
    <TableHead className="text-right" aria-sort={ariaSort(field, sortBy, sortOrder)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onSort(field)}
        className="ml-auto min-h-11 justify-end px-2 text-inherit hover:bg-transparent hover:text-foreground"
      >
        {label}
        {active ? (
          sortOrder === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </Button>
    </TableHead>
  )
}

/**
 * Sortable table header for liquidity table
 * Story 7.3: Liquidity Table & Liquidation Planner
 * Story 169.10: sortable heads became real buttons with aria-sort (keyboard).
 */
export function LiquidityTableHeader({ sortBy, sortOrder, onSort }: LiquidityTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-8"></TableHead>
        <TableHead className="min-w-[200px]">Товар</TableHead>
        <TableHead className="text-center">Статус</TableHead>
        <SortHead
          label="Оборот"
          field="turnover_days"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
        <SortHead
          label="Скорость"
          field="velocity_per_day"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
        <TableHead className="text-right">Остаток</TableHead>
        <SortHead
          label="Стоимость"
          field="stock_value"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
        <TableHead className="text-center">Действие</TableHead>
      </TableRow>
    </TableHeader>
  )
}
