'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StockoutRisk } from '@/types/supply-planning'

/**
 * Supply Table Pagination Footer
 * Extracted from SupplyPlanningTable.tsx — Story 6.3.
 *
 * Results count, page size selector, and page navigation.
 */

interface SupplyTablePaginationProps {
  startIndex: number
  endIndex: number
  totalItems: number
  activeFilter: StockoutRisk | null
  pageSize: number
  currentPage: number
  totalPages: number
  pageSizeOptions: number[]
  onPageSizeChange: (size: string) => void
  onPageChange: (page: number | ((prev: number) => number)) => void
}

export function SupplyTablePagination({
  startIndex,
  endIndex,
  totalItems,
  activeFilter,
  pageSize,
  currentPage,
  totalPages,
  pageSizeOptions,
  onPageSizeChange,
  onPageChange,
}: SupplyTablePaginationProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t px-4 py-3">
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Показано {startIndex + 1}–{endIndex} из {totalItems} товаров
        {activeFilter && <span className="ml-1 text-muted-foreground">(фильтр: {activeFilter})</span>}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">На странице:</span>
          <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(size => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-8 px-2"
          >
            «
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8 px-2"
          >
            ‹
          </Button>

          <span className="px-3 text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-8 px-2"
          >
            ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 px-2"
          >
            »
          </Button>
        </div>
      </div>
    </div>
  )
}
