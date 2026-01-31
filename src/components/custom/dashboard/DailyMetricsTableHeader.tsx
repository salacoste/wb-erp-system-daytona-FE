'use client'

/**
 * DailyMetricsTableHeader Component
 * Story 62.8-FE: Daily Metrics Table View
 *
 * Sortable header row for the daily metrics table.
 * Implements aria-sort for accessibility.
 *
 * @see docs/stories/epic-62/story-62.8-fe-daily-metrics-table.md
 */

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { SortDirection } from '@/hooks/useSortableTable'
import type { ColumnDef } from './table-columns'

interface DailyMetricsTableHeaderProps {
  columns: ColumnDef[]
  sortKey: string | null
  sortDirection: SortDirection
  onSort: (key: string) => void
}

/** Get aria-sort value from sort state */
function getAriaSort(
  columnKey: string,
  sortKey: string | null,
  sortDirection: SortDirection
): 'ascending' | 'descending' | 'none' | undefined {
  if (columnKey !== sortKey || !sortDirection) return 'none'
  return sortDirection === 'asc' ? 'ascending' : 'descending'
}

/** Render sort indicator icon */
function SortIndicator({
  columnKey,
  sortKey,
  sortDirection,
}: {
  columnKey: string
  sortKey: string | null
  sortDirection: SortDirection
}) {
  if (columnKey !== sortKey || !sortDirection) {
    return <ChevronsUpDown className="h-4 w-4 opacity-30" aria-hidden="true" />
  }
  if (sortDirection === 'asc') {
    return <ChevronUp className="h-4 w-4" aria-hidden="true" />
  }
  return <ChevronDown className="h-4 w-4" aria-hidden="true" />
}

export function DailyMetricsTableHeader({
  columns,
  sortKey,
  sortDirection,
  onSort,
}: DailyMetricsTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-gray-50">
      <TableRow className="border-b-2 border-gray-200 hover:bg-gray-50">
        {columns.map(column => (
          <TableHead
            key={column.key}
            scope="col"
            role="columnheader"
            aria-sort={
              column.sortable ? getAriaSort(column.key, sortKey, sortDirection) : undefined
            }
            aria-label={column.sortable ? `${column.label}, нажмите для сортировки` : column.label}
            style={{ width: column.width, minWidth: column.width }}
            className={cn(
              'h-12 px-4 text-[13px] font-semibold text-gray-700 whitespace-nowrap',
              column.align === 'right' ? 'text-right' : 'text-left',
              column.key === 'date' && 'sticky left-0 bg-gray-50 z-20',
              column.sortable && 'cursor-pointer select-none hover:bg-gray-100'
            )}
            onClick={() => column.sortable && onSort(column.key)}
            onKeyDown={e => {
              if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onSort(column.key)
              }
            }}
            tabIndex={column.sortable ? 0 : undefined}
          >
            <div
              className={cn('flex items-center gap-1', column.align === 'right' && 'justify-end')}
            >
              <span>{column.label}</span>
              {column.sortable && (
                <SortIndicator
                  columnKey={column.key}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                />
              )}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}
