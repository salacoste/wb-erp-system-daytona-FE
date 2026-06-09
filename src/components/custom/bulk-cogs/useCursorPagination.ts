'use client'

import { useState, useCallback } from 'react'

/**
 * Cursor-based pagination state management for BulkCogsForm.
 * Extracted for file-size compliance.
 */
export function useCursorPagination() {
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [prevCursors, setPrevCursors] = useState<string[]>([])

  const goNext = useCallback(
    (nextCursor: string | undefined) => {
      if (!nextCursor) return
      setPrevCursors(prev => [...prev, cursor!])
      setCursor(nextCursor)
    },
    [cursor]
  )

  const goPrev = useCallback(() => {
    const copy = [...prevCursors]
    setCursor(copy.pop())
    setPrevCursors(copy)
  }, [prevCursors])

  const resetCursor = useCallback(() => {
    setCursor(undefined)
    setPrevCursors([])
  }, [])

  return { cursor, prevCursors, goNext, goPrev, resetCursor }
}
