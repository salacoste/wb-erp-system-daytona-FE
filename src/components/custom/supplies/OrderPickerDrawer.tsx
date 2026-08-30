'use client'

/**
 * OrderPickerDrawer Component
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Full-screen drawer for selecting orders to add to a supply.
 * Orchestrator that delegates to OrderPickerContent and OrderPickerFooter.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { OrderPickerContent } from './OrderPickerContent'
import { OrderPickerFooter } from './OrderPickerFooter'
import { useOrdersForSupply } from '@/hooks/useOrdersForSupply'
import { useAddOrdersToSupply } from '@/hooks/useAddOrdersToSupply'
import type { EligibleSupplierStatus } from '@/hooks/useOrdersForSupply'
import type { OrderPickerDrawerProps } from './order-picker-constants'
import { useOrderPickerSelection } from './useOrderPickerSelection'

// Re-export type for backward compatibility (barrel export in index.ts)
export type { OrderPickerDrawerProps } from './order-picker-constants'

export function OrderPickerDrawer({
  supplyId,
  isOpen,
  onClose,
  onSuccess,
}: OrderPickerDrawerProps) {
  const returnFocusRef = useRef<HTMLElement | null>(null)
  // Filter state
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<EligibleSupplierStatus | null>(null)

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

  // Orders from response
  const orders = ordersData?.items ?? []

  // Selection state (auto-resets when drawer closes)
  const selection = useOrderPickerSelection(orders, isOpen)

  // Add orders mutation
  const addOrdersMutation = useAddOrdersToSupply(supplyId, {
    onSuccess: () => {
      selection.handleClearSelection()
      onSuccess?.()
      onClose()
    },
  })

  // Reset filter state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSearchValue('')
      setStatusFilter(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) return

    const rememberFocus = () => {
      if (document.activeElement instanceof HTMLElement) {
        if (document.activeElement.closest('[role="dialog"], [role="alertdialog"]')) return
        returnFocusRef.current = document.activeElement
      }
    }

    rememberFocus()
    document.addEventListener('focusin', rememberFocus)
    return () => document.removeEventListener('focusin', rememberFocus)
  }, [isOpen])

  // Filter logic
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchValue) count++
    if (statusFilter) count++
    return count
  }, [searchValue, statusFilter])

  const handleClearFilters = useCallback(() => {
    setSearchValue('')
    setStatusFilter(null)
  }, [])

  const handleAddOrders = useCallback(() => {
    if (selection.selectedCount === 0) return
    addOrdersMutation.mutate(Array.from(selection.selectedIds))
  }, [selection.selectedCount, selection.selectedIds, addOrdersMutation])

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-2xl lg:max-w-3xl"
        aria-describedby="order-picker-description"
        onOpenAutoFocus={() => {
          if (document.activeElement instanceof HTMLElement) {
            returnFocusRef.current = document.activeElement
          }
        }}
        onCloseAutoFocus={event => {
          if (!returnFocusRef.current?.isConnected) return
          event.preventDefault()
          returnFocusRef.current.focus()
        }}
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
          selectedCount={selection.selectedCount}
          isNearLimit={selection.isNearLimit}
          isAtLimit={selection.isAtLimit}
          isAllSelected={selection.isAllSelected}
          isIndeterminate={selection.isIndeterminate}
          selectedIds={selection.selectedIds}
          onToggleOrder={selection.handleToggleOrder}
          onToggleAll={selection.handleToggleAll}
          onClearSelection={selection.handleClearSelection}
        />

        <OrderPickerFooter
          selectedCount={selection.selectedCount}
          isPending={addOrdersMutation.isPending}
          onClose={onClose}
          onAddOrders={handleAddOrders}
        />
      </SheetContent>
    </Sheet>
  )
}
