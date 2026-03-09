'use client'

/**
 * Hook for StorageBySkuTable state management
 * Extracted from StorageBySkuTable.tsx for file size compliance (Epic 74)
 * Story 24.3-FE: Storage by SKU Table
 *
 * Manages: sort state, search with debounce, filtered/sorted data, row click handling
 */

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { StorageBySkuItem } from '@/types/storage-analytics'
import {
  type SortField,
  type SortOrder,
  type StorageBySkuTableProps,
  SEARCH_DEBOUNCE_MS,
  filterAndSortData,
} from './storage-sku-table-utils'

export function useStorageBySkuTable({
  data,
  onProductClick,
  onSortChange,
  onSearch,
}: Pick<StorageBySkuTableProps, 'data' | 'onProductClick' | 'onSortChange' | 'onSearch'>) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('storage_cost_total')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query to avoid filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      onSearch?.(searchQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchQuery, onSearch])

  // Filter and sort data locally
  const filteredAndSortedData: StorageBySkuItem[] = useMemo(
    () => filterAndSortData(data, debouncedQuery, sortField, sortOrder),
    [data, debouncedQuery, sortField, sortOrder]
  )

  // Handle sort click
  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortField(field)
    setSortOrder(newOrder)
    onSortChange?.(field, newOrder)
  }

  // Handle row click
  const handleRowClick = (nmId: string) => {
    if (onProductClick) {
      onProductClick(nmId)
    } else {
      router.push(`/analytics/sku?nm_id=${nmId}`)
    }
  }

  // Handle search input change (debounce is handled by useEffect)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return {
    sortField,
    sortOrder,
    searchQuery,
    debouncedQuery,
    filteredAndSortedData,
    handleSort,
    handleRowClick,
    handleSearchChange,
  }
}
