'use client'

/**
 * OrderPickerDrawer Component
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Full-screen drawer for selecting orders to add to a supply.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Loader2, AlertTriangle, RefreshCw, Package } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderPickerFilters } from './OrderPickerFilters'
import { OrderPickerTable } from './OrderPickerTable'
import { useOrdersForSupply } from '@/hooks/useOrdersForSupply'
import { useAddOrdersToSupply } from '@/hooks/useAddOrdersToSupply'
import type { EligibleSupplierStatus } from '@/hooks/useOrdersForSupply'

// =============================================================================
// Constants
// =============================================================================

const MAX_SELECTION = 1000
const NEAR_LIMIT_THRESHOLD = 900
const LIST_HEIGHT = 500 // Height of virtualized list

// =============================================================================
// Types
// =============================================================================

interface OrderPickerDrawerProps {
  supplyId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// =============================================================================
// Russian Pluralization
// =============================================================================

function pluralizeOrders(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod100 >= 11 && mod100 <= 14) return 'заказов'
  if (mod10 === 1) return 'заказ'
  if (mod10 >= 2 && mod10 <= 4) return 'заказа'
  return 'заказов'
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function OrderPickerDrawer({
  supplyId,
  isOpen,
  onClose,
  onSuccess,
}: OrderPickerDrawerProps) {
  // Filter state
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<EligibleSupplierStatus | null>(null)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Fetch orders
  const {
    data: ordersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrdersForSupply(
    {
      search: searchValue || undefined,
      supplier_status: statusFilter || undefined,
    },
    { enabled: isOpen }
  )

  // Add orders mutation
  const addOrdersMutation = useAddOrdersToSupply(supplyId, {
    onSuccess: () => {
      setSelectedIds(new Set())
      onSuccess?.()
      onClose()
    },
  })

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchValue('')
      setStatusFilter(null)
      setSelectedIds(new Set())
    }
  }, [isOpen])

  // Orders from response
  const orders = ordersData?.items ?? []

  // Filter logic
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchValue) count++
    if (statusFilter) count++
    return count
  }, [searchValue, statusFilter])

  // Selection computed values
  const selectedCount = selectedIds.size
  const isNearLimit = selectedCount > NEAR_LIMIT_THRESHOLD
  const isAtLimit = selectedCount >= MAX_SELECTION

  const isAllSelected = useMemo(() => {
    if (orders.length === 0) return false
    return orders.every(order => selectedIds.has(order.orderId))
  }, [orders, selectedIds])

  const isIndeterminate = useMemo(() => {
    if (orders.length === 0) return false
    const selectedVisible = orders.filter(o => selectedIds.has(o.orderId)).length
    return selectedVisible > 0 && selectedVisible < orders.length
  }, [orders, selectedIds])

  // Handlers
  const handleToggleOrder = useCallback((orderId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else if (next.size < MAX_SELECTION) {
        next.add(orderId)
      }
      return next
    })
  }, [])

  const handleToggleAll = useCallback(() => {
    if (isAllSelected) {
      // Deselect all visible
      setSelectedIds(prev => {
        const next = new Set(prev)
        orders.forEach(order => next.delete(order.orderId))
        return next
      })
    } else {
      // Select all visible (up to limit)
      setSelectedIds(prev => {
        const next = new Set(prev)
        for (const order of orders) {
          if (next.size >= MAX_SELECTION) break
          next.add(order.orderId)
        }
        return next
      })
    }
  }, [isAllSelected, orders])

  const handleClearFilters = useCallback(() => {
    setSearchValue('')
    setStatusFilter(null)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleAddOrders = useCallback(() => {
    if (selectedCount === 0) return
    addOrdersMutation.mutate(Array.from(selectedIds))
  }, [selectedCount, selectedIds, addOrdersMutation])

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-2xl lg:max-w-3xl"
        aria-describedby="order-picker-description"
      >
        <SheetHeader>
          <SheetTitle>Добавить заказы в поставку</SheetTitle>
          <SheetDescription id="order-picker-description">
            Выберите заказы для добавления в поставку. Максимум 1000 заказов.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden py-4">
          {/* Filters */}
          <OrderPickerFilters
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onClearFilters={handleClearFilters}
            activeFilterCount={activeFilterCount}
            disabled={isLoading || addOrdersMutation.isPending}
          />

          {/* Selection Counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                Выбрано: {selectedCount} {pluralizeOrders(selectedCount)}
              </span>
              {selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  disabled={addOrdersMutation.isPending}
                >
                  Очистить выбор
                </Button>
              )}
            </div>
          </div>

          {/* Near Limit Warning */}
          {isNearLimit && (
            <Alert variant="default" className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {isAtLimit
                  ? 'Достигнут лимит выбора (максимум 1000 заказов)'
                  : `Приближается к лимиту выбора (${selectedCount}/1000)`}
              </AlertDescription>
            </Alert>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div aria-busy="true" aria-label="Загрузка заказов">
                <LoadingSkeleton />
              </div>
            ) : isError ? (
              <div role="alert" className="flex flex-col items-center justify-center py-12">
                <Package className="mb-4 h-12 w-12 text-red-300" />
                <p className="text-lg font-medium text-gray-700">Не удалось загрузить заказы</p>
                <p className="mt-1 text-sm text-gray-500">
                  {error?.message || 'Произошла ошибка при загрузке'}
                </p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Повторить
                </Button>
              </div>
            ) : (
              <OrderPickerTable
                orders={orders}
                selectedIds={selectedIds}
                onToggleOrder={handleToggleOrder}
                onToggleAll={handleToggleAll}
                isAllSelected={isAllSelected}
                isIndeterminate={isIndeterminate}
                height={LIST_HEIGHT}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={addOrdersMutation.isPending}>
            Закрыть
          </Button>
          <Button
            onClick={handleAddOrders}
            disabled={selectedCount === 0 || addOrdersMutation.isPending}
          >
            {addOrdersMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Добавление...
              </>
            ) : (
              `Добавить выбранные (${selectedCount})`
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
