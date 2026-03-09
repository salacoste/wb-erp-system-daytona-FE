'use client'

import { useState } from 'react'

export const PAGE_SIZE_OPTIONS = [25, 50, 100]

/**
 * Hook for pagination logic in SupplyPlanningTable.
 * Extracted from SupplyPlanningTable.tsx — Story 6.3.
 */
export function useSupplyTablePagination(totalItems: number) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size))
    setCurrentPage(1)
  }

  const resetPage = () => {
    setCurrentPage(1)
  }

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    handlePageSizeChange,
    resetPage,
    PAGE_SIZE_OPTIONS,
  }
}
