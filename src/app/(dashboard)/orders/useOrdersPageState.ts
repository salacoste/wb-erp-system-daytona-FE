/**
 * Orders page state hook
 * Extracted from page.tsx for Story 74.8 (file size compliance)
 *
 * Manages URL-synced filter state, sort, pagination, search debounce,
 * and modal state for the orders list page.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { logger } from '@/lib/logger'
import { format, subDays } from 'date-fns'
import type { SupplierStatus, WbStatus, OrderFbsItem } from '@/types/orders'
import type { SortField, SortOrder } from '@/components/custom/orders'
import { WB_STATUS_OPTIONS } from '@/components/custom/orders/OrdersFilters'

export const PAGE_SIZE = 25

/** Get default date range (last 7 days) */
export function getDefaultDateRange() {
  const to = format(new Date(), 'yyyy-MM-dd')
  const from = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  return { from, to }
}

export function useOrdersPageState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const defaultRange = getDefaultDateRange()
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || defaultRange.from)
  const [dateTo, setDateTo] = useState(searchParams.get('to') || defaultRange.to)
  const [supplierStatus, setSupplierStatus] = useState<SupplierStatus | null>(
    (searchParams.get('supplier_status') as SupplierStatus) || null
  )
  // #200: hydrate wb_status from the URL only if it's a backend-accepted filter value. An
  // unsupported deep-linked status (e.g. canceled_by_client) would 400 the list endpoint and
  // blank the table — the same defect the dropdown restriction guards against. Drop it to null.
  const urlWbStatus = searchParams.get('wb_status')
  const [wbStatus, setWbStatus] = useState<WbStatus | null>(
    WB_STATUS_OPTIONS.some(o => o.value === urlWbStatus) ? (urlWbStatus as WbStatus) : null
  )
  const [searchInput, setSearchInput] = useState(searchParams.get('nm_id') || '')
  const [search, setSearch] = useState(searchParams.get('nm_id') || '')
  const [sortBy, setSortBy] = useState<SortField>(
    (searchParams.get('sort_by') as SortField) || 'created_at'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sort_order') as SortOrder) || 'desc'
  )
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

  // Modal state (Story 40.4-FE: Order Details Modal)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const delay = setTimeout(() => setSearch(searchInput), 500)
    return () => clearTimeout(delay)
  }, [searchInput])

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (dateFrom !== defaultRange.from) params.set('from', dateFrom)
    if (dateTo !== defaultRange.to) params.set('to', dateTo)
    if (supplierStatus) params.set('supplier_status', supplierStatus)
    if (wbStatus) params.set('wb_status', wbStatus)
    if (search) params.set('nm_id', search)
    if (sortBy !== 'created_at') params.set('sort_by', sortBy)
    if (sortOrder !== 'desc') params.set('sort_order', sortOrder)
    if (page > 1) params.set('page', String(page))

    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(url, { scroll: false })
  }, [
    dateFrom,
    dateTo,
    supplierStatus,
    wbStatus,
    search,
    sortBy,
    sortOrder,
    page,
    pathname,
    router,
  ])

  // Handlers
  const handleSortChange = useCallback((field: SortField) => {
    setSortBy((prev: SortField) => {
      if (prev === field) {
        setSortOrder((current: SortOrder) => (current === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('desc')
      return field
    })
    setPage(1)
  }, [])

  const handleRowClick = useCallback((order: OrderFbsItem) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Orders] Row clicked:', order.orderId)
    }
    setSelectedOrderId(order.orderId)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedOrderId(null)
  }, [])

  const handleClearFilters = useCallback(() => {
    const range = getDefaultDateRange()
    setDateFrom(range.from)
    setDateTo(range.to)
    setSupplierStatus(null)
    setWbStatus(null)
    setSearchInput('')
    setSearch('')
    setSortBy('created_at')
    setSortOrder('desc')
    setPage(1)
  }, [])

  const hasActiveFilters =
    supplierStatus !== null ||
    wbStatus !== null ||
    search !== '' ||
    dateFrom !== defaultRange.from ||
    dateTo !== defaultRange.to

  return {
    // Filter state
    dateFrom,
    dateTo,
    supplierStatus,
    wbStatus,
    searchInput,
    search,
    sortBy,
    sortOrder,
    page,
    // Setters for filter change handlers
    setDateFrom,
    setDateTo,
    setSupplierStatus,
    setWbStatus,
    setSearchInput,
    setPage,
    // Modal state
    selectedOrderId,
    // Handlers
    handleSortChange,
    handleRowClick,
    handleCloseModal,
    handleClearFilters,
    // Derived state
    hasActiveFilters,
  }
}
