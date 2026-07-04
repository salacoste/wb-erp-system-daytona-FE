/**
 * OperationalStatusBadge Component
 * Story O1: Order Operational Status UI (Epic Moysklad)
 *
 * Colored badge rendering ORDER_OPERATIONAL_STATUS_LABELS[status].
 * Story O1 color map: NEW=blue, ASSEMBLED=amber, PACKED=orange,
 * SHIPPED=purple, DELIVERED=green, CANCELLED=red, RETURNED=gray.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Story O1)
 */

import { cn } from '@/lib/utils'
import { ORDER_OPERATIONAL_STATUS_LABELS, type OrderOperationalStatus } from '@/types/orders'

interface OperationalStatusBadgeProps {
  status: OrderOperationalStatus
  className?: string
}

/** Color config per operational status (Story O1 spec) */
const STATUS_COLOR_CONFIG: Record<OrderOperationalStatus, { color: string; bgColor: string }> = {
  NEW: { color: 'text-blue-700', bgColor: 'bg-blue-50' },
  ASSEMBLED: { color: 'text-amber-700', bgColor: 'bg-amber-50' },
  PACKED: { color: 'text-orange-700', bgColor: 'bg-orange-50' },
  SHIPPED: { color: 'text-purple-700', bgColor: 'bg-purple-50' },
  DELIVERED: { color: 'text-green-700', bgColor: 'bg-green-50' },
  CANCELLED: { color: 'text-red-700', bgColor: 'bg-red-50' },
  RETURNED: { color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

/**
 * OperationalStatusBadge — colored pill with the Russian label.
 * Param widened to `string` so an out-of-union backend value surfaces as the
 * raw code (Defensive Frontend: indicate, never crash/mislabel).
 */
export function OperationalStatusBadge({ status, className }: OperationalStatusBadgeProps) {
  const config = STATUS_COLOR_CONFIG[status as OrderOperationalStatus] ?? {
    color: 'text-foreground',
    bgColor: 'bg-muted/50',
  }
  const label = ORDER_OPERATIONAL_STATUS_LABELS[status as OrderOperationalStatus] ?? status

  return (
    <span
      data-operational-status={status}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color,
        config.bgColor,
        className
      )}
    >
      {label}
    </span>
  )
}
