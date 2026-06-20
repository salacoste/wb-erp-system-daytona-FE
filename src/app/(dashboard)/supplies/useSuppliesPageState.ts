'use client'

/**
 * State management hook for the Supplies List Page
 * Extracted from page.tsx for file size compliance (Epic 74)
 *
 * Manages filters, sorting, pagination, URL sync, and derived state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useSupplies, useSyncSupplies } from '@/hooks/useSupplies'
import { buildSupplyDetailRoute } from '@/lib/routes'
import type { SupplyStatus, SuppliesSortField, SortOrder, SupplyListItem } from '@/types/supplies'
import {
  PAGE_SIZE,
  DEFAULT_SORT,
  DEFAULT_ORDER,
  getDefaultDateRange,
  sortSupplies,
} from './supplies-page-utils'

export function useSuppliesPageState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const defaultRange = getDefaultDateRange()

  // State
  const [status, setStatus] = useState<SupplyStatus | undefined>(
    (searchParams.get('status') as SupplyStatus) || undefined
  )
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || defaultRange.from)
  const [dateTo, setDateTo] = useState(searchParams.get('to') || defaultRange.to)
  const [sortBy, setSortBy] = useState<SuppliesSortField>(
    (searchParams.get('sort_by') as SuppliesSortField) || DEFAULT_SORT
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sort_order') as SortOrder) || DEFAULT_ORDER
  )
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (dateFrom !== defaultRange.from) params.set('from', dateFrom)
    if (dateTo !== defaultRange.to) params.set('to', dateTo)
    if (sortBy !== DEFAULT_SORT) params.set('sort_by', sortBy)
    if (sortOrder !== DEFAULT_ORDER) params.set('sort_order', sortOrder)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [status, dateFrom, dateTo, sortBy, sortOrder, page, pathname, router])

  // Data fetching (sort is client-side — backend does not support sort params)
  const { data, isLoading, isError, error, refetch } = useSupplies({
    status,
    from: dateFrom,
    to: dateTo,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })
  const sortedItems = useMemo(
    () => sortSupplies(data?.items ?? [], sortBy, sortOrder),
    [data?.items, sortBy, sortOrder]
  )
  const { mutate: triggerSync, isPending: isSyncing } = useSyncSupplies()

  // Handlers
  const handleSortChange = useCallback(
    (field: SuppliesSortField) => {
      if (sortBy === field) {
        setSortOrder(cur => (cur === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortBy(field)
        setSortOrder('desc')
      }
      setPage(1)
    },
    [sortBy]
  )

  const handleRowClick = useCallback(
    (supply: SupplyListItem) => router.push(buildSupplyDetailRoute(supply.id)),
    [router]
  )

  const handleClearFilters = useCallback(() => {
    const range = getDefaultDateRange()
    setStatus(undefined)
    setDateFrom(range.from)
    setDateTo(range.to)
    setSortBy(DEFAULT_SORT)
    setSortOrder(DEFAULT_ORDER)
    setPage(1)
  }, [])

  // Derived state
  const hasFilters =
    status !== undefined || dateFrom !== defaultRange.from || dateTo !== defaultRange.to
  const totalCount = data?.pagination?.total ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const headerProps = {
    lastSyncAt: data?.items?.[0]?.syncedAt ?? null,
    nextSyncAt: null,
    isSyncing,
    onSync: () => triggerSync(),
    onCreateClick: () => setIsCreateModalOpen(true),
  }

  return {
    // Data
    data,
    sortedItems,
    isLoading,
    isError,
    error,
    refetch,
    // Filter state
    status,
    setStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    // Sort state
    sortBy,
    sortOrder,
    // Pagination
    page,
    setPage,
    totalCount,
    totalPages,
    // Modal
    isCreateModalOpen,
    setIsCreateModalOpen,
    // Handlers
    handleSortChange,
    handleRowClick,
    handleClearFilters,
    // Derived
    hasFilters,
    headerProps,
  }
}
