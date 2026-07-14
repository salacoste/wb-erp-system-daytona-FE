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

import { lazy, Suspense, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useOrders, useOrdersSyncStatus, useOrdersSync } from '@/hooks/useOrders'
import { useClientInfo } from '@/hooks/useClientInfo'
import { useAuthStore } from '@/stores/authStore'
import {
  OrdersPageHeader,
  OrdersFilters,
  OrdersTable,
  OrdersPagination,
  OrdersErrorBoundary,
  OrdersSuspenseFallback,
} from '@/components/custom/orders'
import { useOrderOperationalStatus } from '@/components/custom/orders/useOrderOperationalStatus'
import { useOrderActions } from '@/components/custom/orders/useOrderActions'
import { OrdersLoadingState, OrdersErrorState, OrdersSlowLoadingState } from './OrdersPageStates'
import { useOrdersPageState, PAGE_SIZE } from './useOrdersPageState'
import { useOrdersFilterHandlers } from './useOrdersFilterHandlers'
import { useDelayedLoadingState } from '@/hooks/useDelayedLoadingState'

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
  const filters = useOrdersFilterHandlers({
    setDateFrom: state.setDateFrom,
    setDateTo: state.setDateTo,
    setSupplierStatus: state.setSupplierStatus,
    setWbStatus: state.setWbStatus,
    setSearchInput: state.setSearchInput,
    setPage: state.setPage,
  })

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
  // Story O1: operational-status change controller (handler + pending UUID).
  const { onOperationalStatusChange, pendingUuid: operationalStatusPendingUuid } =
    useOrderOperationalStatus()
  // Stories O2/O3/O4: per-row order-actions controller (confirm / cancel / meta).
  const { onConfirm, onCancel, onSaveMeta, pendingUuid: actionsPendingUuid } = useOrderActions()
  const showSlowLoading = useDelayedLoadingState(isLoading && !data)

  // Story 86.2: Client info (PII) — Owner only, hook is no-op for other roles
  // Selector argument intentionally named `auth` to avoid shadowing the outer
  // `state = useOrdersPageState()` binding.
  const userRole = useAuthStore(auth => auth.user?.role)
  const showClientColumn = userRole === 'Owner'
  const orderIds = useMemo(() => data?.items?.map(o => o.orderId) ?? [], [data?.items])
  const { data: clientInfoMap } = useClientInfo(orderIds)

  // Calculate pagination
  const totalCount = data?.pagination?.total ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Loading state
  if (isLoading && !data) {
    if (showSlowLoading) {
      return (
        <OrdersSlowLoadingState
          headerProps={{
            lastSyncAt: syncStatus?.lastSyncAt ?? null,
            isSyncing,
            onSync: () => triggerSync(),
          }}
          onRetry={() => refetch()}
        />
      )
    }

    return (
      <OrdersLoadingState
        headerProps={{
          lastSyncAt: syncStatus?.lastSyncAt ?? null,
          isSyncing,
          onSync: () => triggerSync(),
        }}
      />
    )
  }

  // Error state
  if (isError) {
    return (
      <OrdersErrorState
        headerProps={{
          lastSyncAt: syncStatus?.lastSyncAt ?? null,
          isSyncing,
          onSync: () => triggerSync(),
        }}
        error={error}
        onRetry={() => refetch()}
      />
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
            onDateFromChange={filters.onDateFromChange}
            onDateToChange={filters.onDateToChange}
            onSupplierStatusChange={filters.onSupplierStatusChange}
            onWbStatusChange={filters.onWbStatusChange}
            onSearchChange={filters.onSearchChange}
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
        showClientColumn={showClientColumn}
        clientInfoMap={clientInfoMap}
        onOperationalStatusChange={onOperationalStatusChange}
        operationalStatusPendingUuid={operationalStatusPendingUuid}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onSaveMeta={onSaveMeta}
        actionsPendingUuid={actionsPendingUuid}
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
