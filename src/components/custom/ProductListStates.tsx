'use client'

/**
 * ProductList state components (loading, error, empty, degraded-mode alert).
 * Extracted from ProductList.tsx for 200-line compliance.
 */

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { ProductSearchFilter } from './ProductSearchFilter'
import { ProductEmptyState } from './ProductEmptyState'
import { ProductLoadingSkeleton } from './ProductLoadingSkeleton'

interface StateComponentProps {
  isLoading: boolean
  isFirstLoad: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/** Handlers extracted from ProductList for the empty-state view */
interface ProductListHandlers {
  searchInput: string
  handleSearchChange: (value: string) => void
  filterLabel: string
  handleFilterToggle: () => void
}

/** Renders loading/error states for ProductList. Returns null when data is ready. */
export function renderProductListState({
  isLoading,
  isFirstLoad,
  isError,
  error,
  refetch,
}: StateComponentProps): React.ReactElement | null {
  if (isLoading && isFirstLoad) return <ProductLoadingSkeleton />

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

  return null
}

/** Renders the empty-list state with search/filter bar */
export function renderProductEmptyState(handlers: ProductListHandlers): React.ReactElement {
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

/** Request #190: margin degraded-mode alert banner */
export function MarginUnavailableAlert() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Маржа временно недоступна из-за ошибки сервера — товары показаны без маржи. Откройте
        карточку товара или вкладку «С себестоимостью», чтобы увидеть маржу.
      </AlertDescription>
    </Alert>
  )
}
