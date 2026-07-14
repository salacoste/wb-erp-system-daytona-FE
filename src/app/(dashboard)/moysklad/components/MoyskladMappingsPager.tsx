'use client'

/**
 * Pager controls for MoyskladMappingsTable (M4).
 * Mirrors the M2 MoyskladProductsTable pager: page size 20, «Назад»/«Вперёд» +
 * «Показано N–M из total» hint. Disabled at bounds; aria-labels for a11y.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MoyskladMappingsPagerProps {
  page: number
  pageSize: number
  rowsCount: number
  total: number
  onPageChange: (page: number) => void
}

export function MoyskladMappingsPager({
  page,
  pageSize,
  rowsCount,
  total,
  onPageChange,
}: MoyskladMappingsPagerProps) {
  const offset = page * pageSize
  const hasPrevious = offset > 0
  const hasNext = offset + rowsCount < total
  // 1-based range for the «Показано N–M из total» hint (only when rows exist).
  const shownFrom = rowsCount > 0 ? offset + 1 : 0
  const shownTo = offset + rowsCount

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        {rowsCount > 0 ? (
          <>
            Показано {shownFrom}–{shownTo} из {total}
          </>
        ) : (
          <>Показано 0 из {total}</>
        )}
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={!hasPrevious}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Следующая страница"
        >
          Вперёд
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
