/**
 * OperationalStatusSelect Component
 * Story O1: Order Operational Status UI (Epic Moysklad)
 *
 * «Сменить статус» dropdown showing ONLY the ALLOWED_TRANSITIONS[status]
 * options. No dropdown rendered for terminal statuses (DELIVERED/CANCELLED/
 * RETURNED). On select → fires onStatusChange(uuid, targetStatus).
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Story O1)
 */

'use client'

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import {
  ALLOWED_TRANSITIONS,
  ORDER_OPERATIONAL_STATUS_LABELS,
  TERMINAL_STATUSES,
  type OrderOperationalStatus,
} from '@/types/orders'

interface OperationalStatusSelectProps {
  /** OrderFbs UUID (order.id) — passed to onStatusChange */
  orderUuid: string
  /** Current operational status */
  currentStatus: OrderOperationalStatus
  /** Disable interaction (e.g. while a mutation is in-flight) */
  disabled?: boolean
  /** Callback with the chosen target status */
  onStatusChange: (orderUuid: string, status: OrderOperationalStatus) => void
}

/**
 * OperationalStatusSelect — transition control.
 * Returns null (no control) for terminal statuses.
 */
export function OperationalStatusSelect({
  orderUuid,
  currentStatus,
  disabled = false,
  onStatusChange,
}: OperationalStatusSelectProps) {
  // Terminal statuses have no transitions → badge only, no dropdown.
  if (TERMINAL_STATUSES.has(currentStatus)) {
    return null
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus]

  // Defensive: if the state machine has no transitions for a non-terminal
  // status (shouldn't happen), render nothing rather than an empty dropdown.
  if (allowed.length === 0) {
    return null
  }

  return (
    <Select
      disabled={disabled}
      value=""
      onValueChange={value => {
        if (value) {
          onStatusChange(orderUuid, value as OrderOperationalStatus)
        }
      }}
    >
      <SelectTrigger
        aria-label={`Сменить статус заказа ${orderUuid}`}
        className="h-7 w-[150px] text-xs"
      >
        <span className="text-muted-foreground">Сменить статус</span>
      </SelectTrigger>
      <SelectContent>
        {allowed.map(status => (
          <SelectItem key={status} value={status}>
            {ORDER_OPERATIONAL_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
