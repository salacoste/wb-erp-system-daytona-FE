'use client'

// ============================================================================
// COGS History page state management hook
// Extracted from cogs/history/page.tsx (Story 5.1-fe)
// ============================================================================

import { useState, useCallback } from 'react'

interface PaginationData {
  cursor?: string | null
  has_more?: boolean
  total?: number
}

interface UseCogsHistoryPageStateReturn {
  cursor: string | undefined
  prevCursors: string[]
  includeDeleted: boolean
  limit: number
  handlePreviousPage: () => void
  handleNextPage: (pagination: PaginationData | undefined) => void
  handleIncludeDeletedChange: (value: boolean) => void
  hasPrevious: boolean
  hasNext: (pagination: PaginationData | undefined) => boolean
}

/**
 * Manages pagination and filter state for the COGS history page
 */
export function useCogsHistoryPageState(): UseCogsHistoryPageStateReturn {
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [prevCursors, setPrevCursors] = useState<string[]>([])
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const limit = 25

  const handlePreviousPage = useCallback(() => {
    if (prevCursors.length > 0) {
      const newPrevCursors = [...prevCursors]
      const previousCursor = newPrevCursors.pop()
      setPrevCursors(newPrevCursors)
      setCursor(previousCursor)
    }
  }, [prevCursors])

  const handleNextPage = useCallback(
    (pagination: PaginationData | undefined) => {
      if (pagination?.cursor) {
        setPrevCursors(cursor ? [...prevCursors, cursor] : prevCursors)
        setCursor(pagination.cursor)
      }
    },
    [cursor, prevCursors]
  )

  const handleIncludeDeletedChange = useCallback((value: boolean) => {
    setIncludeDeleted(value)
    setCursor(undefined)
    setPrevCursors([])
  }, [])

  const hasPrevious = prevCursors.length > 0 || cursor !== undefined

  const hasNext = useCallback(
    (pagination: PaginationData | undefined) => Boolean(pagination?.has_more),
    []
  )

  return {
    cursor,
    prevCursors,
    includeDeleted,
    limit,
    handlePreviousPage,
    handleNextPage,
    handleIncludeDeletedChange,
    hasPrevious,
    hasNext,
  }
}
