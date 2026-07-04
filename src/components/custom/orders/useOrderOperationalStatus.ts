/**
 * useOrderOperationalStatus — Story O1 controller hook.
 * Wraps useUpdateOrderOperationalStatus and exposes a stable change handler
 * plus the pending-UUID for per-row disabling. Extracted from the orders page
 * for the 200-line source cap.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Story O1)
 */

'use client'

import { useUpdateOrderOperationalStatus } from '@/hooks/useOrders'
import type { OrderOperationalStatus } from '@/types/orders'

/** Args type for the change handler (uuid + target status). */
export type OperationalStatusChangeHandler = (
  orderUuid: string,
  status: OrderOperationalStatus
) => void

/** Controller shape consumed by the orders table. */
export interface OrderOperationalStatusController {
  onOperationalStatusChange: OperationalStatusChangeHandler
  pendingUuid: string | null
}

/**
 * Returns a stable onOperationalStatusChange handler + the in-flight order UUID.
 */
export function useOrderOperationalStatus(): OrderOperationalStatusController {
  const {
    mutate: updateOperationalStatus,
    variables: operationalStatusVars,
    isPending,
  } = useUpdateOrderOperationalStatus()

  const onOperationalStatusChange: OperationalStatusChangeHandler = (orderUuid, status) => {
    updateOperationalStatus({ orderUuid, status })
  }

  return {
    onOperationalStatusChange,
    pendingUuid: isPending ? (operationalStatusVars?.orderUuid ?? null) : null,
  }
}
