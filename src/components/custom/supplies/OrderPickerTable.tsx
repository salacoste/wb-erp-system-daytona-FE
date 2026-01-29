'use client'

/**
 * OrderPickerTable Component
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Virtualized order list with react-window for 1000+ rows.
 */

import { useCallback, useMemo } from 'react'
import { List, type RowComponentProps } from 'react-window'
import { Package } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { OrderFbsItem, SupplierStatus } from '@/types/orders'

// =============================================================================
// Constants
// =============================================================================

const ROW_HEIGHT = 48

const STATUS_CONFIG: Record<SupplierStatus, { label: string; className: string }> = {
  new: { label: 'Новый', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  confirm: { label: 'Подтвержден', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  complete: { label: 'Завершен', className: 'bg-green-50 text-green-700 border-green-200' },
  cancel: { label: 'Отменен', className: 'bg-red-50 text-red-700 border-red-200' },
}

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

interface RowPropsData {
  orders: OrderFbsItem[]
  selectedIds: Set<string>
  onToggleOrder: (orderId: string) => void
}

// =============================================================================
// Row Component
// =============================================================================

function OrderRow({
  index,
  orders,
  selectedIds,
  onToggleOrder,
  style,
}: RowComponentProps<RowPropsData>) {
  const order = orders[index]
  const isSelected = selectedIds.has(order.orderId)
  const statusConfig = STATUS_CONFIG[order.supplierStatus]

  const handleClick = () => onToggleOrder(order.orderId)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleOrder(order.orderId)
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div
      style={style}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        flex cursor-pointer items-center gap-3 border-b px-4
        transition-colors hover:bg-gray-50
        ${isSelected ? 'bg-blue-50' : 'bg-white'}
      `}
    >
      <div onClick={handleCheckboxClick}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleOrder(order.orderId)}
          aria-label={`Выбрать заказ #${order.orderId}`}
        />
      </div>
      <div className="w-[110px] shrink-0 font-mono text-sm">#{order.orderId.slice(-8)}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{order.vendorCode}</div>
        <div className="truncate text-xs text-gray-500">{order.productName || '—'}</div>
      </div>
      <div className="w-[90px] shrink-0 text-right text-sm font-medium">
        {formatCurrency(order.salePrice)}
      </div>
      <div className="w-[100px] shrink-0">
        <Badge variant="outline" className={statusConfig.className}>
          {statusConfig.label}
        </Badge>
      </div>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
      <Package className="mb-4 h-12 w-12 text-gray-300" aria-hidden="true" />
      <p className="text-lg font-medium text-gray-500">Нет доступных заказов</p>
      <p className="mt-1 text-sm text-gray-400">Нет заказов для добавления в поставку</p>
    </div>
  )
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
    <div className="flex flex-col rounded-lg border bg-white">
      {/* Header Row */}
      <div className="flex items-center gap-3 border-b bg-gray-50 px-4 py-3">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAllChange}
          aria-label="Выбрать все заказы"
          className={isIndeterminate && !isAllSelected ? 'opacity-50' : ''}
        />
        <span className="text-sm font-medium text-gray-700">Выбрать все ({orders.length})</span>
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
