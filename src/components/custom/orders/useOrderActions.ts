/**
 * useOrderActions — Stories O2 / O3 / O4 controller hook.
 * Wraps the per-row order-action mutations (confirm, cancel, meta) and exposes
 * stable handlers + the in-flight order UUID for per-row disabling. Mirrors
 * useOrderOperationalStatus (Story O1). Extracted from the orders page for the
 * 200-line source cap.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Stories O2–O4)
 */

'use client'

import { useConfirmOrder } from '@/hooks/useOrders'

/** Confirm-handler signature (uuid of the order to confirm). */
export type ConfirmOrderHandler = (orderUuid: string) => void

/** Controller shape consumed by the orders table actions cell. */
export interface OrderActionsController {
  onConfirm: ConfirmOrderHandler
  /** OrderFbs UUID currently being acted upon, or null when idle. */
  pendingUuid: string | null
}

/**
 * Returns a stable onConfirm handler + the in-flight order UUID.
 * Cancel (O3) and meta (O4) handlers are added in their stories.
 */
export function useOrderActions(): OrderActionsController {
  const { mutate: confirm, variables, isPending } = useConfirmOrder()

  const onConfirm: ConfirmOrderHandler = orderUuid => {
    confirm({ orderUuid })
  }

  return {
    onConfirm,
    pendingUuid: isPending ? (variables?.orderUuid ?? null) : null,
  }
}
