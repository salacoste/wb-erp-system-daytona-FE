'use client'

/**
 * OrderPickerDrawer Component
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Full-screen drawer for selecting orders to add to a supply.
 * Orchestrator that delegates to OrderPickerContent and OrderPickerFooter.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { OrderPickerContent } from './OrderPickerContent'
import { OrderPickerFooter } from './OrderPickerFooter'
import { MAX_SELECTION, NEAR_LIMIT_THRESHOLD } from './order-picker-constants'
import { useOrdersForSupply } from '@/hooks/useOrdersForSupply'
import { useAddOrdersToSupply } from '@/hooks/useAddOrdersToSupply'
import type { EligibleSupplierStatus } from '@/hooks/useOrdersForSupply'
import type { OrderPickerDrawerProps } from './order-picker-constants'

// Re-export type for backward compatibility (barrel export in index.ts)
export type { OrderPickerDrawerProps } from './order-picker-constants'

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
      setSelectedIds(prev => {
        const next = new Set(prev)
        orders.forEach(order => next.delete(order.orderId))
        return next
      })
    } else {
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

        <OrderPickerContent
          orders={orders}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          isPending={addOrdersMutation.isPending}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          activeFilterCount={activeFilterCount}
          onClearFilters={handleClearFilters}
          selectedCount={selectedCount}
          isNearLimit={isNearLimit}
          isAtLimit={isAtLimit}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          selectedIds={selectedIds}
          onToggleOrder={handleToggleOrder}
          onToggleAll={handleToggleAll}
          onClearSelection={handleClearSelection}
        />

        <OrderPickerFooter
          selectedCount={selectedCount}
          isPending={addOrdersMutation.isPending}
          onClose={onClose}
          onAddOrders={handleAddOrders}
        />
      </SheetContent>
    </Sheet>
  )
}
