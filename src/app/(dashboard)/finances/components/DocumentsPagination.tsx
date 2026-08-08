'use client'

/**
 * DocumentsPagination — NEW-7 limit/offset pagination controls.
 *
 * Prev/Next buttons + a range label (offset+1 .. offset+count). Prev disabled at
 * offset 0; Next disabled when the current page returned fewer than `pageSize`
 * rows (no more pages). Stateless — owned by DocumentsTable.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface DocumentsPaginationProps {
  offset: number
  pageSize: number
  /** Number of rows on the current page (drives Next-page disable). */
  count: number
  onPrev: () => void
  onNext: () => void
}

export function DocumentsPagination({
  offset,
  pageSize,
  count,
  onPrev,
  onNext,
}: DocumentsPaginationProps) {
  // Next is disabled when the current page is short of a full page (last page)
  // OR there is no data at all.
  const isLastPage = count < pageSize
  const rangeFrom = count > 0 ? offset + 1 : 0
  const rangeTo = offset + count

  return (
    <div className="flex items-center justify-between" role="navigation" aria-label="Пагинация">
      <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {count > 0 ? `${rangeFrom}–${rangeTo}` : '—'}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onPrev}
          disabled={offset === 0}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onNext}
          disabled={isLastPage}
          aria-label="Следующая страница"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
