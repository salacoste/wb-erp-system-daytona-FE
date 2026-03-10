'use client'

/**
 * OrderPickerContent - Body content for OrderPickerDrawer
 * Story 53.5-FE: Order Picker Drawer
 *
 * Extracted from OrderPickerDrawer.tsx for file-size compliance (Epic 74).
 */

import { Package, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderPickerFilters } from './OrderPickerFilters'
import { OrderPickerTable } from './OrderPickerTable'
import { pluralizeOrders, LIST_HEIGHT } from './order-picker-constants'
import type { OrderFbsItem } from '@/types/orders'
import type { EligibleSupplierStatus } from '@/hooks/useOrdersForSupply'

// =============================================================================
// Types
// =============================================================================

export interface OrderPickerContentProps {
  orders: OrderFbsItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  isPending: boolean
  // Filter props
  searchValue: string
  onSearchChange: (value: string) => void
  statusFilter: EligibleSupplierStatus | null
  onStatusChange: (status: EligibleSupplierStatus | null) => void
  activeFilterCount: number
  onClearFilters: () => void
  // Selection props
  selectedCount: number
  isNearLimit: boolean
  isAtLimit: boolean
  isAllSelected: boolean
  isIndeterminate: boolean
  selectedIds: Set<string>
  onToggleOrder: (orderId: string) => void
  onToggleAll: () => void
  onClearSelection: () => void
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

export function OrderPickerContent({
  orders,
  isLoading,
  isError,
  error,
  refetch,
  isPending,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  activeFilterCount,
  onClearFilters,
  selectedCount,
  isNearLimit,
  isAtLimit,
  isAllSelected,
  isIndeterminate,
  selectedIds,
  onToggleOrder,
  onToggleAll,
  onClearSelection,
}: OrderPickerContentProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden py-4">
      {/* Filters */}
      <OrderPickerFilters
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusChange={onStatusChange}
        onClearFilters={onClearFilters}
        activeFilterCount={activeFilterCount}
        disabled={isLoading || isPending}
      />

      {/* Selection Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            Выбрано: {selectedCount} {pluralizeOrders(selectedCount)}
          </span>
          {selectedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearSelection} disabled={isPending}>
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
            onToggleOrder={onToggleOrder}
            onToggleAll={onToggleAll}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            height={LIST_HEIGHT}
          />
        )}
      </div>
    </div>
  )
}
