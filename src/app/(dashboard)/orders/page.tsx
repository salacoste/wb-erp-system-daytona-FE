/**
 * Orders List Page
 * Story 40.3-FE: Orders List Page
 * Story 40.7-FE: Integration & Polish
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Main page for FBS orders with filters, table, pagination, and modal.
 * Reference: docs/stories/epic-40/story-40.3-fe-orders-list-page.md
 */

'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useOrders, useOrdersSyncStatus, useOrdersSync } from '@/hooks/useOrders'
import {
  OrdersPageHeader,
  OrdersFilters,
  OrdersTable,
  OrdersPagination,
  OrdersLoadingSkeleton,
  OrdersErrorBoundary,
  OrdersSuspenseFallback,
  type SortField,
  type SortOrder,
} from '@/components/custom/orders'
import type { SupplierStatus, WbStatus, OrderFbsItem } from '@/types/orders'

// Lazy load heavy components (Story 40.7-FE: Lazy Loading)
const OrderDetailsModal = lazy(() =>
  import('@/components/custom/orders/OrderDetailsModal').then(m => ({
    default: m.OrderDetailsModal,
  }))
)

const PAGE_SIZE = 25

/** Get default date range (last 7 days) */
function getDefaultDateRange() {
  const to = format(new Date(), 'yyyy-MM-dd')
  const from = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  return { from, to }
}

/**
 * OrdersPage - Main orders list page component
 */
export default function OrdersPage() {
  return (
    <OrdersErrorBoundary>
      <OrdersPageContent />
    </OrdersErrorBoundary>
  )
}

/**
 * OrdersPageContent - Inner component wrapped by error boundary
 */
function OrdersPageContent() {
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
  const [wbStatus, setWbStatus] = useState<WbStatus | null>(
    (searchParams.get('wb_status') as WbStatus) || null
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

  // Fetch orders
  const { data, isLoading, isError, error, refetch } = useOrders({
    from: dateFrom,
    to: dateTo,
    supplier_status: supplierStatus || undefined,
    wb_status: wbStatus || undefined,
    nm_id: search ? parseInt(search, 10) : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  // Sync status and mutation
  const { data: syncStatus } = useOrdersSyncStatus()
  const { mutate: triggerSync, isPending: isSyncing } = useOrdersSync()

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
      console.info('[Orders] Row clicked:', order.orderId)
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

  // Calculate pagination
  const totalCount = data?.pagination?.total ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <OrdersPageHeader
          lastSyncAt={syncStatus?.lastSyncAt ?? null}
          isSyncing={isSyncing}
          onSync={() => triggerSync()}
        />
        <OrdersLoadingSkeleton />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <OrdersPageHeader
          lastSyncAt={syncStatus?.lastSyncAt ?? null}
          isSyncing={isSyncing}
          onSync={() => triggerSync()}
        />
        <Alert variant="destructive" data-testid="orders-error-state">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки заказов'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="orders-page">
      {/* Page Header */}
      <OrdersPageHeader
        lastSyncAt={syncStatus?.lastSyncAt ?? null}
        isSyncing={isSyncing}
        onSync={() => triggerSync()}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <OrdersFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            supplierStatus={supplierStatus}
            wbStatus={wbStatus}
            searchValue={searchInput}
            onDateFromChange={(v: string) => {
              setDateFrom(v)
              setPage(1)
            }}
            onDateToChange={(v: string) => {
              setDateTo(v)
              setPage(1)
            }}
            onSupplierStatusChange={(v: SupplierStatus | null) => {
              setSupplierStatus(v)
              setPage(1)
            }}
            onWbStatusChange={(v: WbStatus | null) => {
              setWbStatus(v)
              setPage(1)
            }}
            onSearchChange={(v: string) => {
              setSearchInput(v)
              setPage(1)
            }}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </CardContent>
      </Card>

      {/* Orders Table */}
      <OrdersTable
        orders={data?.items ?? []}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onRowClick={handleRowClick}
        hasFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <OrdersPagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}

      {/* Order Details Modal - Lazy loaded (Story 40.7-FE) */}
      <Suspense fallback={<OrdersSuspenseFallback />}>
        <OrderDetailsModal orderId={selectedOrderId} onClose={handleCloseModal} />
      </Suspense>
    </div>
  )
}
