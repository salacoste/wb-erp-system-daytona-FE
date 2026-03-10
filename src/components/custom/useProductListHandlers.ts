'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ProductListItem } from '@/types/api'

/**
 * ProductList event handlers and pagination state
 * Extracted from ProductList.tsx for file size compliance
 * Story 4.1: Single Product COGS Assignment Interface
 */

export interface ProductListHandlersParams {
  showOnlyWithoutCogs: boolean
  enableSelection: boolean
  onProductSelect?: (product: ProductListItem) => void
}

export function useProductListHandlers({
  showOnlyWithoutCogs,
  enableSelection,
  onProductSelect,
}: ProductListHandlersParams) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [has_cogs, setHasCogs] = useState<boolean | undefined>(
    showOnlyWithoutCogs ? false : undefined
  )
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [prevCursors, setPrevCursors] = useState<string[]>([])
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  useEffect(() => {
    const timeoutId = setTimeout(() => setSearch(searchInput), 500)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    setCursor(undefined)
    setPrevCursors([])
  }, [])

  const handleFilterToggle = useCallback(() => {
    setHasCogs(prev => {
      if (prev === undefined) return false
      if (prev === false) return true
      return undefined
    })
    setCursor(undefined)
    setPrevCursors([])
  }, [])

  const handleProductClick = useCallback(
    (product: ProductListItem) => {
      if (enableSelection && onProductSelect) onProductSelect(product)
    },
    [enableSelection, onProductSelect]
  )

  const handlePreviousPage = useCallback(() => {
    setPrevCursors(prev => {
      if (prev.length > 0) {
        const newPrevCursors = [...prev]
        const previousCursor = newPrevCursors.pop()
        setCursor(previousCursor)
        return newPrevCursors
      }
      return prev
    })
  }, [])

  const handleNextPage = useCallback(
    (nextCursor: string | undefined) => {
      if (nextCursor) {
        setPrevCursors(prev => [...prev, cursor!])
        setCursor(nextCursor)
      }
    },
    [cursor]
  )

  const markLoaded = useCallback(() => setIsFirstLoad(false), [])

  const hasPrevious = prevCursors.length > 0 || cursor !== undefined
  const filterLabel =
    has_cogs === undefined ? 'Все товары' : has_cogs ? 'С себестоимостью' : 'Без себестоимости'

  return {
    searchInput,
    search,
    has_cogs,
    cursor,
    isFirstLoad,
    hasPrevious,
    filterLabel,
    handleSearchChange,
    handleFilterToggle,
    handleProductClick,
    handlePreviousPage,
    handleNextPage,
    markLoaded,
  }
}
