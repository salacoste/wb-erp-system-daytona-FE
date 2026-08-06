/** Sortable column header button for PerformanceMetricsTable — extracted for 200-line limit.
 *
 * Story 163.1 (keyboard accessibility): the interactive target is a native <button> so
 * Enter/Space activate sort without a pointer; a visible focus ring is present; the
 * Russian accessible name carries the current order; icons are aria-hidden (sort state
 * is exposed authoritatively via `aria-sort` on the owning <th> in PerformanceTableHeader,
 * plus this button name). */

'use client'

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { SortField, SortOrder } from './performance-table.types'

interface SortableHeaderProps {
  label: string
  field: SortField
  currentSort: SortField
  currentOrder: SortOrder
  onSort: (field: SortField) => void
}

// Russian current-order phrase so the button's accessible name conveys state, not just
// the action + column (AC: accessible name describes the sort action and column).
function currentOrderLabel(isSorted: boolean, order: SortOrder): string {
  if (!isSorted) return 'без сортировки'
  return order === 'asc' ? 'по возрастанию' : 'по убыванию'
}

export function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: SortableHeaderProps) {
  const isSorted = currentSort === field

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      aria-label={`Сортировать по «${label}», текущий порядок: ${currentOrderLabel(isSorted, currentOrder)}`}
    >
      {label}
      {isSorted ? (
        currentOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        )
      ) : (
        <ChevronsUpDown className="h-4 w-4 opacity-50" aria-hidden="true" />
      )}
    </button>
  )
}
