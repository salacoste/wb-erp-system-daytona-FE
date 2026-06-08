/** Sortable column header for PerformanceMetricsTable — extracted for 200-line limit */

'use client'

import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import type { SortField, SortOrder } from './performance-table.types'

interface SortableHeaderProps {
  label: string
  field: SortField
  currentSort: SortField
  currentOrder: SortOrder
  onSort: (field: SortField) => void
}

export function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: SortableHeaderProps) {
  const isSorted = currentSort === field
  const sortDirection = isSorted ? currentOrder : undefined

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      aria-label={`Сортировать по ${label}`}
      aria-sort={sortDirection ? (`${sortDirection}ending` as const) : undefined}
    >
      {label}
      {isSorted ? (
        currentOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" aria-label="по возрастанию" />
        ) : (
          <ArrowDown className="h-4 w-4" aria-label="по убыванию" />
        )
      ) : (
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  )
}
