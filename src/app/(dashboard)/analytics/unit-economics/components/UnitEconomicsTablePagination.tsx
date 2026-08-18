'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAGE_SIZE_OPTIONS } from './unit-economics-table-utils'

/**
 * Pagination footer for the Unit Economics table.
 * Story 5.2: UX-002 — Pagination controls for 50+ SKUs.
 */

interface UnitEconomicsTablePaginationProps {
  startIndex: number
  endIndex: number
  totalItems: number
  showPagination: boolean
  pageSize: number
  currentPage: number
  totalPages: number
  onPageSizeChange: (value: string) => void
  onPageChange: (page: number) => void
}

export function UnitEconomicsTablePagination({
  startIndex,
  endIndex,
  totalItems,
  showPagination,
  pageSize,
  currentPage,
  totalPages,
  onPageSizeChange,
  onPageChange,
}: UnitEconomicsTablePaginationProps) {
  return (
    <div className="border-t bg-muted/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Показано {startIndex + 1}&ndash;{Math.min(endIndex, totalItems)} из {totalItems} записей
        </div>

        {showPagination && (
          <div className="flex items-center gap-4">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Строк:</span>
              <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(size => (
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
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
