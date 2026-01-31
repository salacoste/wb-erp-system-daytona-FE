/**
 * Unit Economics Table Header Component
 * Story 63.10-FE: Unit Economics Table Enhancement
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Sortable column headers for unit economics table.
 * @see docs/stories/epic-63/story-63.10-fe-unit-economics-enhancement.md
 */

'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type SortField = 'revenue' | 'net_margin_pct' | 'cogs_pct' | 'net_profit'
export type SortOrder = 'asc' | 'desc'

export interface SortState {
  field: SortField
  order: SortOrder
}

export interface UnitEconomicsTableHeaderProps {
  /** Current sort state */
  currentSort: SortState
  /** Callback when sort changes */
  onSort: (field: SortField) => void
}

/** Convert sort order to aria-sort value */
function getAriaSort(
  field: SortField,
  currentSort: SortState
): 'ascending' | 'descending' | undefined {
  if (currentSort.field !== field) return undefined
  return currentSort.order === 'asc' ? 'ascending' : 'descending'
}

/**
 * Sort icon component showing current sort direction
 */
function SortIcon({ field, currentSort }: { field: SortField; currentSort: SortState }) {
  if (currentSort.field !== field) {
    return <ArrowUpDown className="h-4 w-4 ml-1" />
  }
  return currentSort.order === 'desc' ? (
    <ArrowDown className="h-4 w-4 ml-1" />
  ) : (
    <ArrowUp className="h-4 w-4 ml-1" />
  )
}

/**
 * Unit Economics Table Header
 *
 * Displays sortable column headers with:
 * - Product name (non-sortable)
 * - Profitability status (non-sortable)
 * - Revenue, COGS%, Margin%, Profit (sortable)
 * - Visual sort direction indicators
 * - Accessibility attributes
 */
export function UnitEconomicsTableHeader({ currentSort, onSort }: UnitEconomicsTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead scope="col">Товар</TableHead>
        <TableHead scope="col" className="text-center">
          Статус
        </TableHead>
        <TableHead
          scope="col"
          className="text-right cursor-pointer hover:bg-accent"
          onClick={() => onSort('revenue')}
          aria-sort={getAriaSort('revenue', currentSort)}
        >
          <button
            className="flex items-center justify-end w-full"
            aria-label="Сортировать по выручке"
          >
            Выручка
            <SortIcon field="revenue" currentSort={currentSort} />
          </button>
        </TableHead>
        <TableHead
          scope="col"
          className="text-right cursor-pointer hover:bg-accent"
          onClick={() => onSort('cogs_pct')}
          aria-sort={getAriaSort('cogs_pct', currentSort)}
        >
          <button className="flex items-center justify-end w-full" aria-label="Сортировать по COGS">
            COGS %
            <SortIcon field="cogs_pct" currentSort={currentSort} />
          </button>
        </TableHead>
        <TableHead
          scope="col"
          className="text-right cursor-pointer hover:bg-accent"
          onClick={() => onSort('net_margin_pct')}
          aria-sort={getAriaSort('net_margin_pct', currentSort)}
        >
          <button
            className="flex items-center justify-end w-full"
            aria-label="Сортировать по марже"
          >
            Маржа %
            <SortIcon field="net_margin_pct" currentSort={currentSort} />
          </button>
        </TableHead>
        <TableHead
          scope="col"
          className="text-right cursor-pointer hover:bg-accent"
          onClick={() => onSort('net_profit')}
          aria-sort={getAriaSort('net_profit', currentSort)}
        >
          <button
            className="flex items-center justify-end w-full"
            aria-label="Сортировать по прибыли"
          >
            Прибыль
            <SortIcon field="net_profit" currentSort={currentSort} />
          </button>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}
