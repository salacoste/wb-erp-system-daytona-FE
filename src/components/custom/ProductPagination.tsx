'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface ProductPaginationProps {
  displayedCount: number
  totalCount: number
  searchQuery?: string
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

/**
 * Pagination controls for ProductList
 * Extracted from ProductList.tsx for better maintainability
 */
export function ProductPagination({
  displayedCount,
  totalCount,
  searchQuery,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: ProductPaginationProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        Показано {displayedCount} из {totalCount} товаров
        {searchQuery && (
          <span className="ml-2 text-gray-400">
            (поиск: &quot;{searchQuery}&quot;)
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
        >
          Вперёд
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default ProductPagination
