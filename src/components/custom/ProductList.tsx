'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table'
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
import { ResizableTableHead } from './ResizableTableHead'

export interface ProductListProps {
  onProductSelect?: (product: ProductListItem) => void
  selectedProductId?: string
  showOnlyWithoutCogs?: boolean
  enableSelection?: boolean
  enableMarginDisplay?: boolean
}

// Default column widths for ProductList table
const DEFAULT_COLUMN_WIDTHS = {
  article: 120,
  vendor_code: 140,
  name: 300,
  cogs: 140,
  margin: 150,
  actions: 100,
}

/**
 * Product list component with search, filters, and pagination
 * Story 4.1: Single Product COGS Assignment Interface
 * Refactored: Components extracted to ProductMarginCell, ProductSearchFilter, etc.
 * Enhanced: Resizable columns with localStorage persistence
 */
export function ProductList({
  onProductSelect,
  selectedProductId,
  showOnlyWithoutCogs = false,
  enableSelection = false,
  enableMarginDisplay = false,
}: ProductListProps) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [has_cogs, setHasCogs] = useState<boolean | undefined>(
    showOnlyWithoutCogs ? false : undefined
  )
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [prevCursors, setPrevCursors] = useState<string[]>([])
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const limit = 25

  // Resizable column widths with localStorage persistence
  const { widths, handleResize } = useColumnWidths(
    'products-table',
    DEFAULT_COLUMN_WIDTHS
  )

  const { isPolling: isProductPolling } = useMarginPollingStore()

  // Debounce search input (500ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => setSearch(searchInput), 500)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  // Fetch products with filters
  const { data, isLoading, isError, error, refetch } = useProducts({
    search: search || undefined,
    has_cogs,
    cursor,
    limit,
    include_margin: enableMarginDisplay,
  })

  // Track pending margin products for polling
  const pendingMargin = usePendingMarginProducts(data?.products || [], enableMarginDisplay)
  const { mutate: triggerRecalculation, isPending: isRecalculating } = useManualMarginRecalculation()

  useEffect(() => {
    if (data) setIsFirstLoad(false)
  }, [data])

  // Event handlers (memoized with useCallback to prevent unnecessary re-renders)
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    setCursor(undefined)
    setPrevCursors([])
  }, [])

  const handleFilterToggle = useCallback(() => {
    setHasCogs((prev) => {
      if (prev === undefined) return false
      if (prev === false) return true
      return undefined
    })
    setCursor(undefined)
    setPrevCursors([])
  }, [])

  const handleProductClick = useCallback((product: ProductListItem) => {
    if (enableSelection && onProductSelect) onProductSelect(product)
  }, [enableSelection, onProductSelect])

  const handlePreviousPage = useCallback(() => {
    setPrevCursors((prev) => {
      if (prev.length > 0) {
        const newPrevCursors = [...prev]
        const previousCursor = newPrevCursors.pop()
        setCursor(previousCursor)
        return newPrevCursors
      }
      return prev
    })
  }, [])

  const handleNextPage = useCallback(() => {
    if (data?.pagination?.next_cursor) {
      setPrevCursors((prev) => [...prev, cursor!])
      setCursor(data.pagination.next_cursor)
    }
  }, [data?.pagination?.next_cursor, cursor])

  // Computed values
  const hasPrevious = prevCursors.length > 0 || cursor !== undefined
  const hasNext = Boolean(data?.pagination?.next_cursor)
  const filterLabel = has_cogs === undefined ? 'Все товары' : has_cogs ? 'С себестоимостью' : 'Без себестоимости'

  // Loading state
  if (isLoading && isFirstLoad) return <ProductLoadingSkeleton />

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки товаров'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Повторить</Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!data?.products?.length) {
    return (
      <div className="space-y-4">
        <ProductSearchFilter
          searchValue={searchInput}
          onSearchChange={handleSearchChange}
          filterLabel={filterLabel}
          onFilterToggle={handleFilterToggle}
        />
        <ProductEmptyState hasSearchQuery={!!searchInput} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ProductSearchFilter
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        filterLabel={filterLabel}
        onFilterToggle={handleFilterToggle}
      />

      <div className="rounded-md border overflow-x-auto">
        <Table className="table-fixed" aria-label="Список товаров">
          <caption className="sr-only">
            Список товаров с себестоимостью и маржинальностью
          </caption>
          <TableHeader>
            <TableRow>
              <ResizableTableHead
                columnKey="article"
                width={widths.article}
                onResize={handleResize}
              >
                Артикул
              </ResizableTableHead>
              <ResizableTableHead
                columnKey="vendor_code"
                width={widths.vendor_code}
                onResize={handleResize}
              >
                Арт. поставщика
              </ResizableTableHead>
              <ResizableTableHead
                columnKey="name"
                width={widths.name}
                onResize={handleResize}
              >
                Название
              </ResizableTableHead>
              <ResizableTableHead
                columnKey="cogs"
                width={widths.cogs}
                onResize={handleResize}
              >
                Себестоимость
              </ResizableTableHead>
              <ResizableTableHead
                columnKey="margin"
                width={widths.margin}
                onResize={handleResize}
                isLast={!enableSelection}
              >
                Маржа
              </ResizableTableHead>
              {enableSelection && (
                <ResizableTableHead
                  columnKey="actions"
                  width={widths.actions}
                  onResize={handleResize}
                  isLast
                >
                  Действия
                </ResizableTableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.products.map((product) => (
              <ProductTableRow
                key={product.nm_id}
                product={product}
                isSelected={selectedProductId === product.nm_id}
                enableSelection={enableSelection}
                enableMarginDisplay={enableMarginDisplay}
                isPolling={isProductPolling(product.nm_id)}
                shouldShowRetryButton={pendingMargin.shouldShowRetryButton}
                getAffectedWeeks={pendingMargin.getAffectedWeeks}
                triggerRecalculation={triggerRecalculation}
                isRecalculating={isRecalculating}
                onProductClick={handleProductClick}
                columnWidths={widths}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <ProductPagination
        displayedCount={data.products.length}
        totalCount={data.pagination?.total || 0}
        searchQuery={search || undefined}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPrevious={handlePreviousPage}
        onNext={handleNextPage}
      />
    </div>
  )
}
