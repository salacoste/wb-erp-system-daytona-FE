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
  new: { label: 'Новый', className: 'bg-muted/50 text-foreground border-border' },
  confirm: {
    label: 'Подтвержден',
    className: 'border-status-information/30 bg-status-information/10 text-status-information',
  },
  complete: {
    label: 'Завершен',
    className: 'border-status-success/30 bg-status-success/10 text-status-success',
  },
  cancel: {
    label: 'Отменен',
    className: 'border-status-error/30 bg-status-error/10 text-status-error',
  },
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
  ariaAttributes,
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

  return (
    <div
      style={style}
      {...ariaAttributes}
      className={`
        flex items-center border-b
        transition-colors hover:bg-muted/50
        ${isSelected ? 'bg-primary/10' : 'bg-card'}
      `}
    >
      <div className="pl-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleOrder(order.orderId)}
          aria-label={`Выбрать заказ #${order.orderId}`}
        />
      </div>
      <button
        // A native button keeps the virtualized row action keyboard-operable
        // without adding another focus-management layer to react-window.
        type="button"
        aria-label={`Переключить выбор заказа #${order.orderId}`}
        aria-pressed={isSelected}
        onClick={handleClick}
        className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 pr-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="w-[110px] shrink-0 font-mono text-sm">#{order.orderId.slice(-8)}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{order.vendorCode}</div>
          <div className="truncate text-xs text-muted-foreground">{order.productName || '—'}</div>
        </div>
        <div className="w-[90px] shrink-0 text-right text-sm font-medium">
          {order.salePrice != null ? formatCurrency(order.salePrice) : '—'}
        </div>
        <div className="w-[100px] shrink-0">
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
      </button>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
      <Package className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <p className="text-lg font-medium text-muted-foreground">Нет доступных заказов</p>
      <p className="mt-1 text-sm text-muted-foreground">Нет заказов для добавления в поставку</p>
    </div>
  )
}
