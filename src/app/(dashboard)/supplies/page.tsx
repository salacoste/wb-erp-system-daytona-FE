'use client'

import { useRef } from 'react'

/**
 * Supplies List Page
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Main page for FBS supplies with filters, table, pagination.
 * State/handlers extracted to useSuppliesPageState for file size compliance (Epic 74).
 * Reference: docs/stories/epic-53/story-53.2-fe-supplies-list-page.md
 */

import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import {
  SuppliesPageHeader,
  SuppliesFilters,
  SuppliesTable,
  SuppliesPagination,
  SuppliesLoadingSkeleton,
  CreateSupplyModal,
} from '@/components/custom/supplies'
import { useSuppliesPageState } from './useSuppliesPageState'

export default function SuppliesPage() {
  const createButtonRef = useRef<HTMLButtonElement>(null)
  const {
    data,
    sortedItems,
    isLoading,
    isError,
    error,
    refetch,
    status,
    setStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortBy,
    sortOrder,
    page,
    setPage,
    totalCount,
    totalPages,
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleSortChange,
    handleRowClick,
    handleClearFilters,
    hasFilters,
    headerProps,
    canManageSupplies,
  } = useSuppliesPageState()

  // Loading
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <SuppliesPageHeader {...headerProps} createButtonRef={createButtonRef} />
        <SuppliesLoadingSkeleton />
      </div>
    )
  }

  // Error
  if (isError && !data) {
    return (
      <div className="space-y-6">
        <SuppliesPageHeader {...headerProps} createButtonRef={createButtonRef} />
        <Alert variant="destructive" data-testid="supplies-error-state">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки поставок'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="supplies-page">
      <SuppliesPageHeader {...headerProps} createButtonRef={createButtonRef} />

      {isError && data && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Не удалось обновить поставки. Показаны последние доступные данные.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <SuppliesFilters
            status={status}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onStatusChange={v => {
              setStatus(v)
              setPage(1)
            }}
            onDateFromChange={v => {
              setDateFrom(v)
              setPage(1)
            }}
            onDateToChange={v => {
              setDateTo(v)
              setPage(1)
            }}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasFilters}
          />
        </CardContent>
      </Card>

      <SuppliesTable
        supplies={sortedItems}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onRowClick={handleRowClick}
        hasFilters={hasFilters}
        onClearFilters={handleClearFilters}
      />

      {totalCount > 0 && (
        <SuppliesPagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}

      {canManageSupplies && (
        <CreateSupplyModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          returnFocusRef={createButtonRef}
        />
      )}
    </div>
  )
}
