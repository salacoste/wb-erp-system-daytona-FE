'use client'

/**
 * Shipments List Page
 * Epic 76-FE, Story 76.1: Shipment Planning & Cost Calculation
 * Route: /shipments
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useSkuPackaging } from '@/hooks-v1/use-sku-packaging'
import {
  ShipmentsEmptyState,
  ShipmentsTable,
  CreateShipmentDialog,
} from '@/components/custom/shipments'
import { useShipmentsPageState } from './useShipmentsPageState'

export default function ShipmentsPage() {
  const {
    shipments,
    total,
    page,
    limit,
    statusFilter,
    sortOrder,
    isLoading,
    isError,
    error,
    refetch,
    isCreateOpen,
    setIsCreateOpen,
    handleStatusChange,
    handlePageChange,
    handleLimitChange,
    handleSortToggle,
  } = useShipmentsPageState()

  const { data: skuPackaging } = useSkuPackaging()
  const hasSkuPackaging = (skuPackaging?.length ?? 0) > 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Отправки</h1>
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
        <h1 className="text-2xl font-semibold">Отправки</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки отправок'}</span>
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
        <h1 className="text-2xl font-semibold">Отправки</h1>
        {shipments.length > 0 && (
          <Button onClick={() => setIsCreateOpen(true)}>Создать отправку</Button>
        )}
      </div>

      {shipments.length === 0 && !statusFilter ? (
        <ShipmentsEmptyState
          hasSkuPackaging={hasSkuPackaging}
          onCreateClick={() => setIsCreateOpen(true)}
        />
      ) : (
        <ShipmentsTable
          shipments={shipments}
          total={total}
          page={page}
          limit={limit}
          statusFilter={statusFilter}
          sortOrder={sortOrder}
          onStatusChange={handleStatusChange}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onSortToggle={handleSortToggle}
        />
      )}

      <CreateShipmentDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}
