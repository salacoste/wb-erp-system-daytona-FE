/**
 * OperationalStatusBadge Component
 * Story O1: Order Operational Status UI (Epic Moysklad)
 *
 * Colored badge rendering ORDER_OPERATIONAL_STATUS_LABELS[status].
 * Story O1 color map: NEW=blue, ASSEMBLED=amber, PACKED=orange,
 * SHIPPED=purple, DELIVERED=green, CANCELLED=red, RETURNED=gray.
 * Story 172.14-FE semantic tokens: blue→information, purple→pending
 * (theme's hue-277 token, wave 2), amber/orange→warning (orange keeps /15
 * vs ASSEMBLED /10), green→success, red→error, gray→muted.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Story O1)
 */

import { cn } from '@/lib/utils'
import { ORDER_OPERATIONAL_STATUS_LABELS, type OrderOperationalStatus } from '@/types/orders'

interface OperationalStatusBadgeProps {
  status: OrderOperationalStatus
  className?: string
}

/** Color config per operational status (Story O1 spec, tokens per 172.14-FE) */
const STATUS_COLOR_CONFIG: Record<OrderOperationalStatus, { color: string; bgColor: string }> = {
  NEW: { color: 'text-status-information', bgColor: 'bg-status-information/10' },
  ASSEMBLED: { color: 'text-status-warning', bgColor: 'bg-status-warning/10' },
  PACKED: { color: 'text-status-warning', bgColor: 'bg-status-warning/15' },
  SHIPPED: { color: 'text-status-pending', bgColor: 'bg-status-pending/10' },
  DELIVERED: { color: 'text-status-success', bgColor: 'bg-status-success/10' },
  CANCELLED: { color: 'text-status-error', bgColor: 'bg-status-error/10' },
  RETURNED: { color: 'text-muted-foreground', bgColor: 'bg-muted' },
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
