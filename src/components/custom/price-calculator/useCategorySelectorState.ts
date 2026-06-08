import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useCommissions } from '@/hooks/useCommissions'
import { MAX_VISIBLE_RESULTS, SEARCH_DEBOUNCE_MS } from './category-selector-constants'
import type { CategoryCommission } from '@/types/tariffs'
import type { FulfillmentType } from '@/types/price-calculator'

/**
 * State management hook for CategorySelector
 * Extracted for file-size compliance
 */
export function useCategorySelectorState(
  fulfillmentType: FulfillmentType,
  onChange: (category: CategoryCommission | null) => void
) {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { data: commissionsData, isLoading, error: apiError, refetch } = useCommissions()
  const categories = commissionsData?.commissions ?? []

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [searchInput])

  const filteredCategories = useMemo(() => {
    if (!debouncedSearch.trim()) return categories.slice(0, MAX_VISIBLE_RESULTS)
    const query = debouncedSearch.toLowerCase()
    return categories
      .filter(
        c =>
          c.parentName.toLowerCase().includes(query) || c.subjectName.toLowerCase().includes(query)
      )
      .slice(0, MAX_VISIBLE_RESULTS)
  }, [categories, debouncedSearch])

  const getCommissionPct = useCallback(
    (category: CategoryCommission) =>
      fulfillmentType === 'FBO' ? category.paidStorageKgvp : category.kgvpMarketplace,
    [fulfillmentType]
  )

  const formatCategoryName = (category: CategoryCommission) =>
    `${category.parentName} → ${category.subjectName}`

  const handleSelect = (category: CategoryCommission) => {
    onChange(category)
    setOpen(false)
    setSearchInput('')
    setDebouncedSearch('')
  }

  const handleClear = () => {
    onChange(null)
    setSearchInput('')
    setDebouncedSearch('')
  }

  return {
    open,
    setOpen,
    searchInput,
    setSearchInput,
    debouncedSearch,
    filteredCategories,
    isLoading,
    apiError,
    refetch,
    getCommissionPct,
    formatCategoryName,
    handleSelect,
    handleClear,
  }
}
