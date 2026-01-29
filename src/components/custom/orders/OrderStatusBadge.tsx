/**
 * OrderStatusBadge Component
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays supplier status badge with color-coded styling.
 * Reference: docs/stories/epic-40/story-40.3-fe-orders-list-page.md#AC8
 */

import { cn } from '@/lib/utils'
import type { SupplierStatus } from '@/types/orders'

interface OrderStatusBadgeProps {
  status: SupplierStatus
  className?: string
}

/** Supplier status configuration with Russian labels and colors */
const SUPPLIER_STATUS_CONFIG: Record<
  SupplierStatus,
  { label: string; color: string; bgColor: string }
> = {
  new: { label: 'Новый', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  confirm: { label: 'Подтверждён', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  complete: { label: 'Выполнен', color: 'text-green-700', bgColor: 'bg-green-50' },
  cancel: { label: 'Отменён', color: 'text-red-700', bgColor: 'bg-red-50' },
}

/**
 * Get supplier status configuration
 */
export function getSupplierStatusConfig(status: SupplierStatus) {
  return SUPPLIER_STATUS_CONFIG[status]
}

/**
 * Get supplier status label
 */
export function getSupplierStatusLabel(status: SupplierStatus): string {
  return SUPPLIER_STATUS_CONFIG[status].label
}

/**
 * OrderStatusBadge - Displays supplier status as a colored badge
 */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = SUPPLIER_STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color,
        config.bgColor,
        className
      )}
    >
      {config.label}
    </span>
  )
}
