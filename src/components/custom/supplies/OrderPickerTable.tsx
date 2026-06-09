'use client'

/**
 * OrderPickerTable Component
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Virtualized order list with react-window for 1000+ rows.
 */

import { useCallback, useMemo } from 'react'
import { List } from 'react-window'
import { Checkbox } from '@/components/ui/checkbox'
import type { OrderFbsItem } from '@/types/orders'
import { OrderRow, EmptyState, ROW_HEIGHT } from './OrderPickerRow'
import type { RowPropsData } from './OrderPickerRow'

// =============================================================================
// Types
// =============================================================================

interface OrderPickerTableProps {
  orders: OrderFbsItem[]
  selectedIds: Set<string>
  onToggleOrder: (orderId: string) => void
  onToggleAll: () => void
  isAllSelected: boolean
  isIndeterminate: boolean
  height: number
}

// =============================================================================
// Component
// =============================================================================

export function OrderPickerTable({
  orders,
  selectedIds,
  onToggleOrder,
  onToggleAll,
  isAllSelected,
  isIndeterminate,
  height,
}: OrderPickerTableProps) {
  const handleSelectAllChange = useCallback(() => onToggleAll(), [onToggleAll])

  // Memoize row props
  const rowProps = useMemo<RowPropsData>(
    () => ({ orders, selectedIds, onToggleOrder }),
    [orders, selectedIds, onToggleOrder]
  )

  if (orders.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="flex flex-col rounded-lg border bg-card">
      {/* Header Row */}
      <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-3">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAllChange}
          aria-label="Выбрать все заказы"
          className={isIndeterminate && !isAllSelected ? 'opacity-50' : ''}
        />
        <span className="text-sm font-medium text-foreground">Выбрать все ({orders.length})</span>
      </div>

      {/* Virtualized List */}
      <div role="listbox" aria-label="Список заказов" aria-multiselectable="true">
        <List
          rowComponent={OrderRow}
          rowCount={orders.length}
          rowHeight={ROW_HEIGHT}
          rowProps={rowProps}
          style={{ height: height - 48, width: '100%' }}
        />
      </div>
    </div>
  )
}
