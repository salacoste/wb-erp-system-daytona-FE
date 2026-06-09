'use client'

/**
 * OrderPickerRow — virtualized row component for OrderPickerTable.
 * Extracted from OrderPickerTable.tsx for 200-line compliance.
 */

import { type RowComponentProps } from 'react-window'
import { Package } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { OrderFbsItem, SupplierStatus } from '@/types/orders'

// =============================================================================
// Constants
// =============================================================================

export const ROW_HEIGHT = 48

export const STATUS_CONFIG: Record<SupplierStatus, { label: string; className: string }> = {
  new: { label: 'Новый', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  confirm: { label: 'Подтвержден', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  complete: { label: 'Завершен', className: 'bg-green-50 text-green-700 border-green-200' },
  cancel: { label: 'Отменен', className: 'bg-red-50 text-red-700 border-red-200' },
}

// =============================================================================
// Types
// =============================================================================

export interface RowPropsData {
  orders: OrderFbsItem[]
  selectedIds: Set<string>
  onToggleOrder: (orderId: string) => void
}

// =============================================================================
// Row Component
// =============================================================================

export function OrderRow({
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
        {order.salePrice != null ? formatCurrency(order.salePrice) : '—'}
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

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
      <Package className="mb-4 h-12 w-12 text-gray-300" aria-hidden="true" />
      <p className="text-lg font-medium text-gray-500">Нет доступных заказов</p>
      <p className="mt-1 text-sm text-gray-400">Нет заказов для добавления в поставку</p>
    </div>
  )
}
