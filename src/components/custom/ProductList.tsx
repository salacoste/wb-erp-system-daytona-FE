'use client'

import { useEffect } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Table, TableBody } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMarginPollingStore } from '@/stores/marginPollingStore'
import { usePendingMarginProducts } from '@/hooks/usePendingMarginProducts'
import { useManualMarginRecalculation } from '@/hooks/useManualMarginRecalculation'
import { useColumnWidths } from '@/hooks/useColumnWidths'
import { AlertCircle } from 'lucide-react'
import type { ProductListItem } from '@/types/api'
import { ProductSearchFilter } from './ProductSearchFilter'
import { ProductEmptyState } from './ProductEmptyState'
import { ProductLoadingSkeleton } from './ProductLoadingSkeleton'
import { ProductPagination } from './ProductPagination'
import { ProductTableRow } from './ProductTableRow'
import { ProductListTableHeader } from './ProductListTableHeader'
import { useProductListHandlers } from './useProductListHandlers'

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

  const pendingMargin = usePendingMarginProducts(data?.products || [], enableMarginDisplay)
  const { mutate: triggerRecalculation, isPending: isRecalculating } =
    useManualMarginRecalculation()

  useEffect(() => {
    if (data) handlers.markLoaded()
  }, [data, handlers])

  const hasNext = Boolean(data?.pagination?.next_cursor)

  if (isLoading && handlers.isFirstLoad) return <ProductLoadingSkeleton />

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки товаров'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (!data?.products?.length) {
    return (
      <div className="space-y-4">
        <ProductSearchFilter
          searchValue={handlers.searchInput}
          onSearchChange={handlers.handleSearchChange}
          filterLabel={handlers.filterLabel}
          onFilterToggle={handlers.handleFilterToggle}
        />
        <ProductEmptyState hasSearchQuery={!!handlers.searchInput} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ProductSearchFilter
        searchValue={handlers.searchInput}
        onSearchChange={handlers.handleSearchChange}
        filterLabel={handlers.filterLabel}
        onFilterToggle={handlers.handleFilterToggle}
      />
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
            {data.products.map(product => (
              <ProductTableRow
                key={product.nm_id}
                product={product}
                isSelected={selectedProductId === product.nm_id}
                enableSelection={enableSelection}
                enableMarginDisplay={enableMarginDisplay}
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
