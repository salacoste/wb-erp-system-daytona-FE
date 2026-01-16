'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CogsHistoryPaginationProps {
  displayedCount: number
  totalCount: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

/**
 * COGS History Pagination Component
 * Story 5.1-fe: View COGS History
 *
 * AC: 6 - Pagination: cursor-based, 25 records per page
 * Reference: frontend/docs/stories/epic-5/story-5.1-fe-cogs-history-view.md
 */
export function CogsHistoryPagination({
  displayedCount,
  totalCount,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: CogsHistoryPaginationProps) {
  // Don't show pagination if there's only one page
  if (!hasPrevious && !hasNext && displayedCount === totalCount) {
    return null
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Показано {displayedCount} из {totalCount} записей
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
        >
          Вперёд
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
