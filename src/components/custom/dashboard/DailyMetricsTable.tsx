'use client'

/**
 * DailyMetricsTable Component
 * Story 62.8-FE: Daily Metrics Table View
 *
 * Main table component for displaying daily breakdown metrics.
 * Supports sorting, totals row, and responsive horizontal scroll.
 *
 * @see docs/stories/epic-62/story-62.8-fe-daily-metrics-table.md
 */

import { useCallback, useMemo } from 'react'
import { Download } from 'lucide-react'
import { Table, TableBody, TableFooter } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSortableTable } from '@/hooks/useSortableTable'
import type { DailyMetrics } from '@/types/daily-metrics'
import { DailyMetricsTableHeader } from './DailyMetricsTableHeader'
import { DailyMetricsTableRow } from './DailyMetricsTableRow'
import { COLUMNS, getColumnComparator, calculateTotals } from './table-columns'

export interface DailyMetricsTableProps {
  /** Daily metrics data */
  data: DailyMetrics[]
  /** Period type for context */
  periodType: 'week' | 'month'
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error?: Error | null
}

/** Loading skeleton for table */
function TableSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Загрузка данных">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

/** Empty state component */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <p className="text-sm">Нет данных за выбранный период</p>
    </div>
  )
}

/**
 * Daily metrics table with sorting and totals.
 */
export function DailyMetricsTable({ data, periodType, isLoading, error }: DailyMetricsTableProps) {
  // Memoize comparator getter to avoid recreating on every render
  const getComparator = useCallback((key: string) => getColumnComparator(key), [])

  const { sortedData, sortKey, sortDirection, toggleSort } = useSortableTable(data, getComparator)

  // Calculate totals from original data (not sorted)
  const totals = useMemo(() => calculateTotals(data), [data])

  // Handle loading state
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <TableSkeleton />
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500">
        <p className="text-sm">Ошибка загрузки данных: {error.message}</p>
      </div>
    )
  }

  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Export button (disabled for MVP) */}
      <div className="flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-50 cursor-not-allowed"
                aria-label="Экспорт в CSV"
              >
                <Download className="h-4 w-4 mr-1" aria-hidden="true" />
                Экспорт
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Доступно в будущей версии</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Table with scroll container */}
      <div
        className="overflow-x-auto rounded-lg border border-gray-200"
        role="region"
        aria-label={`Таблица метрик за ${periodType === 'week' ? 'неделю' : 'месяц'}`}
        tabIndex={0}
      >
        <Table className="min-w-[900px]" aria-label="Детализация по дням">
          <DailyMetricsTableHeader
            columns={COLUMNS}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={toggleSort}
          />
          <TableBody>
            {sortedData.map((row, index) => (
              <DailyMetricsTableRow key={row.date} row={row} index={index} />
            ))}
          </TableBody>
          <TableFooter>
            <DailyMetricsTableRow row={totals} index={data.length} isTotals />
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
