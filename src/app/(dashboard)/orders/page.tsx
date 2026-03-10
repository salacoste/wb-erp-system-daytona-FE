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

import { lazy, Suspense } from 'react'
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
} from '@/components/custom/orders'
import type { SupplierStatus, WbStatus } from '@/types/orders'
import { useOrdersPageState, PAGE_SIZE } from './useOrdersPageState'

// Lazy load heavy components (Story 40.7-FE: Lazy Loading)
const OrderDetailsModal = lazy(() =>
  import('@/components/custom/orders/OrderDetailsModal').then(m => ({
    default: m.OrderDetailsModal,
  }))
)

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
  const state = useOrdersPageState()

  // Fetch orders
  const { data, isLoading, isError, error, refetch } = useOrders({
    from: state.dateFrom,
    to: state.dateTo,
    supplier_status: state.supplierStatus || undefined,
    wb_status: state.wbStatus || undefined,
    nm_id: state.search ? parseInt(state.search, 10) : undefined,
    sort_by: state.sortBy,
    sort_order: state.sortOrder,
    limit: PAGE_SIZE,
    offset: (state.page - 1) * PAGE_SIZE,
  })

  // Sync status and mutation
  const { data: syncStatus } = useOrdersSyncStatus()
  const { mutate: triggerSync, isPending: isSyncing } = useOrdersSync()

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
      <OrdersPageHeader
        lastSyncAt={syncStatus?.lastSyncAt ?? null}
        isSyncing={isSyncing}
        onSync={() => triggerSync()}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <OrdersFilters
            dateFrom={state.dateFrom}
            dateTo={state.dateTo}
            supplierStatus={state.supplierStatus}
            wbStatus={state.wbStatus}
            searchValue={state.searchInput}
            onDateFromChange={(v: string) => {
              state.setDateFrom(v)
              state.setPage(1)
            }}
            onDateToChange={(v: string) => {
              state.setDateTo(v)
              state.setPage(1)
            }}
            onSupplierStatusChange={(v: SupplierStatus | null) => {
              state.setSupplierStatus(v)
              state.setPage(1)
            }}
            onWbStatusChange={(v: WbStatus | null) => {
              state.setWbStatus(v)
              state.setPage(1)
            }}
            onSearchChange={(v: string) => {
              state.setSearchInput(v)
              state.setPage(1)
            }}
            onClearFilters={state.handleClearFilters}
            hasActiveFilters={state.hasActiveFilters}
          />
        </CardContent>
      </Card>

      {/* Orders Table */}
      <OrdersTable
        orders={data?.items ?? []}
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        onSortChange={state.handleSortChange}
        onRowClick={state.handleRowClick}
        hasFilters={state.hasActiveFilters}
        onClearFilters={state.handleClearFilters}
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <OrdersPagination
          currentPage={state.page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={state.setPage}
          isLoading={isLoading}
        />
      )}

      {/* Order Details Modal - Lazy loaded (Story 40.7-FE) */}
      <Suspense fallback={<OrdersSuspenseFallback />}>
        <OrderDetailsModal orderId={state.selectedOrderId} onClose={state.handleCloseModal} />
      </Suspense>
    </div>
  )
}
