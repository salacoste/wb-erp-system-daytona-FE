'use client'

/**
 * DailyMetricsTableRow Component
 * Story 62.8-FE: Daily Metrics Table View
 *
 * Renders a single row in the daily metrics table.
 * Handles formatting and color coding.
 *
 * @see docs/stories/epic-62/story-62.8-fe-daily-metrics-table.md
 */

import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { DailyMetrics } from '@/types/daily-metrics'
import { COLUMNS, formatCellValue, type ColumnDef } from './table-columns'

interface DailyMetricsTableRowProps {
  /** Row data */
  row: DailyMetrics
  /** Row index for zebra striping */
  index: number
  /** Whether this is the totals row */
  isTotals?: boolean
}

/**
 * Get cell text color based on column and value.
 */
function getCellColor(column: ColumnDef, value: number): string | undefined {
  if (column.colorize) {
    if (value > 0) return 'text-green-500'
    if (value < 0) return 'text-red-500'
  }
  if (column.negativePrefix) {
    return 'text-gray-500'
  }
  return undefined
}

/**
 * Single row in the daily metrics table.
 */
export function DailyMetricsTableRow({ row, index, isTotals = false }: DailyMetricsTableRowProps) {
  return (
    <TableRow
      className={cn(
        'hover:bg-gray-50 transition-colors',
        !isTotals && index % 2 === 1 && 'bg-gray-50/50',
        isTotals && 'bg-gray-100 font-semibold border-t-2 border-gray-200'
      )}
    >
      {COLUMNS.map(column => {
        const value = row[column.key as keyof DailyMetrics]
        const numValue = typeof value === 'number' ? value : 0
        const formattedValue =
          column.key === 'date' && isTotals ? 'Итого' : formatCellValue(row, column)
        const colorClass = column.key !== 'date' ? getCellColor(column, numValue) : undefined

        return (
          <TableCell
            key={column.key}
            aria-label={`${column.label}: ${formattedValue}`}
            style={{ width: column.width, minWidth: column.width }}
            className={cn(
              'px-4 py-3 text-sm whitespace-nowrap',
              column.align === 'right' ? 'text-right' : 'text-left',
              column.key === 'date' && 'sticky left-0 bg-inherit z-10',
              isTotals ? 'font-semibold text-gray-800' : 'text-gray-800',
              colorClass
            )}
          >
            {formattedValue}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
