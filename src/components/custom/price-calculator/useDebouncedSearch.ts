'use client'

/**
 * Debounced search hook
 * Extracted from ProductSearchSelect for file size compliance
 */

import { useState, useEffect, useRef } from 'react'

const SEARCH_DEBOUNCE_MS = 300

/**
 * Returns a debounced version of a search input value.
 * Updates the output value after SEARCH_DEBOUNCE_MS of inactivity.
 */
export function useDebouncedSearch(initialValue: string): {
  searchInput: string
  debouncedSearch: string
  setSearchInput: (value: string) => void
  setDebouncedSearch: (value: string) => void
  clearSearch: () => void
} {
  const [searchInput, setSearchInput] = useState(initialValue)
  const [debouncedSearch, setDebouncedSearch] = useState(initialValue)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [searchInput])

  const clearSearch = () => {
    setSearchInput('')
    setDebouncedSearch('')
  }

  return { searchInput, debouncedSearch, setSearchInput, setDebouncedSearch, clearSearch }
}
