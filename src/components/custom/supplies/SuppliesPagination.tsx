/**
 * SuppliesPagination Component
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Offset-based pagination controls for supplies table.
 * Reference: docs/stories/epic-53/story-53.2-fe-supplies-list-page.md#AC6
 */

'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface SuppliesPaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total count of supplies */
  totalCount: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Whether loading is in progress */
  isLoading?: boolean
}

/**
 * Format supply count with Russian pluralization
 */
function formatSupplyCount(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} поставок`
  }
  if (lastDigit === 1) {
    return `${count} поставка`
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} поставки`
  }
  return `${count} поставок`
}

/**
 * SuppliesPagination - Pagination controls for supplies table
 */
export function SuppliesPagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  isLoading = false,
}: SuppliesPaginationProps) {
  const hasPrevious = currentPage > 1
  const hasNext = currentPage < totalPages

  const handlePrevious = () => {
    if (hasPrevious) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Total count */}
      <div className="text-sm text-muted-foreground">Всего: {formatSupplyCount(totalCount)}</div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!hasPrevious || isLoading}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>

        <span className="text-sm text-muted-foreground px-2">
          Стр. {currentPage} из {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNext || isLoading}
          aria-label="Следующая страница"
        >
          Вперёд
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

export default SuppliesPagination
