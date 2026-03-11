'use client'

/**
 * SKU Packaging CRUD Page
 * Epic 75-FE, Story 75.3: SKU Packaging Page
 * Route: /shipments/sku-packaging
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import {
  SkuPackagingEmptyState,
  SkuPackagingTable,
  SkuPackagingFormDialog,
  SkuPackagingDeleteDialog,
  BulkAddDialog,
} from '@/components/custom/sku-packaging'
import { useSkuPackagingPageState } from './useSkuPackagingPageState'

export default function SkuPackagingPage() {
  const {
    items,
    hasBoxTypes,
    isLoading,
    isError,
    error,
    refetch,
    isCreateOpen,
    setIsCreateOpen,
    isBulkOpen,
    setIsBulkOpen,
    editingItem,
    deletingItem,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleDeleteClose,
    handleBulkClose,
  } = useSkuPackagingPageState()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Упаковка товаров</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Упаковка товаров</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Упаковка товаров</h1>
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
              Массовое добавление
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>Добавить упаковку</Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <SkuPackagingEmptyState
          hasBoxTypes={hasBoxTypes}
          onCreateClick={() => setIsCreateOpen(true)}
        />
      ) : (
        <SkuPackagingTable items={items} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <SkuPackagingFormDialog
        open={isCreateOpen || !!editingItem}
        item={editingItem}
        onClose={handleFormClose}
      />

      <SkuPackagingDeleteDialog item={deletingItem} onClose={handleDeleteClose} />

      <BulkAddDialog open={isBulkOpen} onClose={handleBulkClose} />
    </div>
  )
}
