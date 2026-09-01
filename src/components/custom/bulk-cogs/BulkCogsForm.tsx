'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useProducts } from '@/hooks/useProducts'
import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { BulkCogsFormData, BulkCogsFormProps } from './bulk-cogs.types'
import { BULK_COGS_PAGE_LIMIT } from './bulk-cogs.types'
import { useBulkCogsSelection } from './useBulkCogsSelection'
import { useBulkCogsSubmit } from './useBulkCogsSubmit'
import {
  BulkCogsSearch,
  BulkCogsEmptyState,
  BulkCogsLoadingSkeleton,
  BulkCogsErrorState,
} from './BulkCogsSearch'
import { BulkCogsProductTable } from './BulkCogsProductTable'
import { BulkCogsFormInputs } from './BulkCogsFormInputs'
import { BulkCogsPreviewDialog } from './BulkCogsPreviewDialog'
import { BulkCogsResultsDialog } from './BulkCogsResultsDialog'
import { useCursorPagination } from './useCursorPagination'

/**
 * Bulk COGS assignment form with product selection
 * Story 4.2: Bulk COGS Assignment Capability
 *
 * @example
 * <BulkCogsForm onSuccess={() => router.push('/cogs')} />
 */
export function BulkCogsForm({ onSuccess }: BulkCogsFormProps) {
  const [search, setSearch] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { cursor, prevCursors, goNext, goPrev, resetCursor } = useCursorPagination()

  const today = new Date().toISOString().split('T')[0]
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset: resetForm,
  } = useForm<BulkCogsFormData>({
    defaultValues: { unit_cost_rub: '', valid_from: today, notes: '' },
  })

  const { data, isLoading, isError, error, refetch } = useProducts({
    search: search || undefined,
    has_cogs: false,
    cursor,
    limit: BULK_COGS_PAGE_LIMIT,
  })

  const selection = useBulkCogsSelection(data?.products)

  const closePreview = useCallback(() => setShowPreview(false), [])
  const openResults = useCallback(() => setShowResults(true), [])

  const submit = useBulkCogsSubmit({
    selectedProducts: selection.selectedProducts,
    onPreviewClose: closePreview,
    onShowResults: openResults,
    onResetForm: resetForm,
    onClearSelection: selection.clearSelection,
    onSetSelection: nmIds => {
      selection.setSelection(nmIds)
      setShowResults(false)
      setShowPreview(true)
    },
    onSuccess,
  })

  const unitCostValue = watch('unit_cost_rub')
  const parsedCost = parseFloat(unitCostValue)
  const formattedPreview = !isNaN(parsedCost) ? formatCogs(parsedCost) : null

  const handleSearchChange = (value: string) => {
    setSearch(value)
    resetCursor()
  }

  const handlePreview = () => {
    if (selection.selectedProducts.size === 0) {
      toast.error('Выберите хотя бы один товар')
      return
    }
    setShowPreview(true)
  }

  if (isLoading) return <BulkCogsLoadingSkeleton />
  if (isError && !data) return <BulkCogsErrorState error={error} onRetry={() => refetch()} />

  const products = data?.products
  if (!products || products.length === 0) {
    return <BulkCogsEmptyState search={search} onSearchChange={handleSearchChange} />
  }

  const selectedCount = selection.selectedProducts.size
  const isDisabled = submit.isPending || submit.isPolling

  return (
    <form onSubmit={handleSubmit(handlePreview)} className="space-y-6">
      {isError && <BulkCogsErrorState error={error} onRetry={() => refetch()} />}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <BulkCogsSearch search={search} onSearchChange={handleSearchChange} />
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Выбрано: {selectedCount} товаров
        </div>
      </div>

      <BulkCogsProductTable
        products={products}
        selectedProducts={selection.selectedProducts}
        allVisibleSelected={selection.allVisibleSelected}
        onProductSelect={selection.handleProductSelect}
        onSelectAll={selection.handleSelectAll}
        totalProducts={data?.pagination?.total || 0}
        hasNextPage={!!data?.pagination?.next_cursor}
        hasPrevPage={prevCursors.length > 0 || cursor !== undefined}
        onNextPage={() => goNext(data?.pagination?.next_cursor)}
        onPrevPage={goPrev}
      />

      <BulkCogsFormInputs
        register={register}
        errors={errors}
        formattedPreview={formattedPreview}
        isDisabled={isDisabled}
        validationErrors={submit.validationErrors}
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={isDisabled || selectedCount === 0} className="flex-1">
          {submit.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Обработка...
            </>
          ) : (
            `Просмотреть (${selectedCount} товаров)`
          )}
        </Button>
      </div>

      <BulkCogsPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        selectedCount={selectedCount}
        selectedProductDetails={selection.selectedProductDetails}
        formattedPreview={formattedPreview}
        isPending={submit.isPending}
        isPolling={submit.isPolling}
        onConfirm={handleSubmit(submit.handleSubmit)}
      />

      <BulkCogsResultsDialog
        open={showResults}
        onOpenChange={setShowResults}
        resultData={submit.resultData}
        isPolling={submit.isPolling}
        pollingAttempts={submit.pollingAttempts}
        pollingTimeout={submit.pollingTimeout}
        pollingStrategy={submit.pollingStrategy}
        onRetry={submit.handleRetry}
      />
    </form>
  )
}
