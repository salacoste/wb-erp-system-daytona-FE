/**
 * OrdersPagination Component
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Offset-based pagination controls for orders table.
 * Reference: docs/stories/epic-40/story-40.3-fe-orders-list-page.md#AC6
 */

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OrdersPaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total count of orders */
  totalCount: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Whether loading is in progress */
  isLoading?: boolean
}

/**
 * Format order count with Russian pluralization
 */
function formatOrderCount(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} заказов`
  }
  if (lastDigit === 1) {
    return `${count} заказ`
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} заказа`
  }
  return `${count} заказов`
}

/**
 * OrdersPagination - Pagination controls for orders table
 */
export function OrdersPagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  isLoading = false,
}: OrdersPaginationProps) {
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
      <div className="text-sm text-muted-foreground">Всего: {formatOrderCount(totalCount)}</div>

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
