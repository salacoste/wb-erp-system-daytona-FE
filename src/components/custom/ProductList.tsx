'use client'

import { useEffect } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Table, TableBody } from '@/components/ui/table'
import { useMarginPollingStore } from '@/stores/marginPollingStore'
import { usePendingMarginProducts } from '@/hooks/usePendingMarginProducts'
import { useManualMarginRecalculation } from '@/hooks/useManualMarginRecalculation'
import { useColumnWidths } from '@/hooks/useColumnWidths'
import type { ProductListItem } from '@/types/api'
import { ProductSearchFilter } from './ProductSearchFilter'
import { ProductPagination } from './ProductPagination'
import { ProductTableRow } from './ProductTableRow'
import { ProductListTableHeader } from './ProductListTableHeader'
import { useProductListHandlers } from './useProductListHandlers'
import {
  renderProductListState,
  renderProductEmptyState,
  MarginUnavailableAlert,
} from './ProductListStates'

export interface ProductListProps {
  onProductSelect?: (product: ProductListItem) => void
  selectedProductId?: string
  showOnlyWithoutCogs?: boolean
  enableSelection?: boolean
  enableMarginDisplay?: boolean
  enableStorageDisplay?: boolean
}

const DEFAULT_COLUMN_WIDTHS = {
  article: 120,
  vendor_code: 140,
  name: 300,
  cogs: 140,
  margin: 150,
  storage: 110,
  actions: 100,
}

/**
 * Product list component with search, filters, and pagination
 * Story 4.1: Single Product COGS Assignment Interface
 */
export function ProductList({
  onProductSelect,
  selectedProductId,
  showOnlyWithoutCogs = false,
  enableSelection = false,
  enableMarginDisplay = false,
  enableStorageDisplay = false,
}: ProductListProps) {
  const limit = 25
  const { widths, handleResize } = useColumnWidths('products-table', DEFAULT_COLUMN_WIDTHS)
  const { isPolling: isProductPolling } = useMarginPollingStore()

  const handlers = useProductListHandlers({
    showOnlyWithoutCogs,
    enableSelection,
    onProductSelect,
  })

  const { data, isLoading, isError, error, refetch } = useProducts({
    search: handlers.search || undefined,
    has_cogs: handlers.has_cogs,
    cursor: handlers.cursor,
    limit,
    include_margin: enableMarginDisplay,
    include_storage: enableStorageDisplay,
  })

  // Request #190: when the list had to fall back without margin (backend 500 on include_cogs),
  // suppress margin display + the futile polling so the page degrades to products-without-margin
  // instead of an empty errored list. Auto-recovers once the backend is fixed.
  const marginUnavailable = data?.marginUnavailable === true
  const effectiveMarginDisplay = enableMarginDisplay && !marginUnavailable

  const pendingMargin = usePendingMarginProducts(data?.products || [], effectiveMarginDisplay)
  const { mutate: triggerRecalculation, isPending: isRecalculating } =
    useManualMarginRecalculation()

  useEffect(() => {
    if (data) handlers.markLoaded()
  }, [data, handlers])

  const hasNext = Boolean(data?.pagination?.next_cursor)

  // Early-return for loading/error states
  const earlyState = renderProductListState({
    isLoading,
    isFirstLoad: handlers.isFirstLoad,
    isError,
    error,
    refetch,
  })
  if (earlyState) return earlyState

  if (!data?.products?.length) {
    return renderProductEmptyState(handlers)
  }

  return (
    <div className="space-y-4">
      <ProductSearchFilter
        searchValue={handlers.searchInput}
        onSearchChange={handlers.handleSearchChange}
        filterLabel={handlers.filterLabel}
        onFilterToggle={handlers.handleFilterToggle}
      />
      {marginUnavailable && <MarginUnavailableAlert />}
      <div className="rounded-md border overflow-x-auto">
        <Table className="table-fixed" aria-label="Список товаров">
          <caption className="sr-only">Список товаров с себестоимостью и маржинальностью</caption>
          <ProductListTableHeader
            widths={widths}
            handleResize={handleResize}
            enableStorageDisplay={enableStorageDisplay}
            enableSelection={enableSelection}
          />
          <TableBody>
            {data.products.map((product, index) => (
              <ProductTableRow
                key={`${product.nm_id}-${index}`}
                product={product}
                isSelected={selectedProductId === product.nm_id}
                enableSelection={enableSelection}
                enableMarginDisplay={effectiveMarginDisplay}
                marginUnavailable={marginUnavailable}
                enableStorageDisplay={enableStorageDisplay}
                isPolling={isProductPolling(product.nm_id)}
                shouldShowRetryButton={pendingMargin.shouldShowRetryButton}
                getAffectedWeeks={pendingMargin.getAffectedWeeks}
                triggerRecalculation={triggerRecalculation}
                isRecalculating={isRecalculating}
                onProductClick={handlers.handleProductClick}
                columnWidths={widths}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <ProductPagination
        displayedCount={data.products.length}
        totalCount={data.pagination?.total || 0}
        searchQuery={handlers.search || undefined}
        hasPrevious={handlers.hasPrevious}
        hasNext={hasNext}
        onPrevious={handlers.handlePreviousPage}
        onNext={() => handlers.handleNextPage(data?.pagination?.next_cursor)}
      />
    </div>
  )
}
