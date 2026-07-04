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

import { useConfirmOrder, useCancelOrder } from '@/hooks/useOrders'

/** Confirm-handler signature (uuid of the order to confirm). */
export type ConfirmOrderHandler = (orderUuid: string) => void

/** Cancel-handler signature (uuid of the order to cancel). */
export type CancelOrderHandler = (orderUuid: string) => void

/** Controller shape consumed by the orders table actions cell. */
export interface OrderActionsController {
  onConfirm: ConfirmOrderHandler
  onCancel: CancelOrderHandler
  /** OrderFbs UUID currently being acted upon, or null when idle. */
  pendingUuid: string | null
}

/**
 * Returns stable onConfirm/onCancel handlers + the in-flight order UUID.
 * Meta (O4) handler is added in its story. `pendingUuid` reflects whichever
 * mutation (confirm or cancel) is currently in-flight.
 */
export function useOrderActions(): OrderActionsController {
  const { mutate: confirm, variables: confirmVars, isPending: confirmPending } = useConfirmOrder()
  const { mutate: cancel, variables: cancelVars, isPending: cancelPending } = useCancelOrder()

  const onConfirm: ConfirmOrderHandler = orderUuid => {
    confirm({ orderUuid })
  }
  const onCancel: CancelOrderHandler = orderUuid => {
    cancel({ orderUuid })
  }

  const pendingUuid =
    confirmPending || cancelPending
      ? (confirmVars?.orderUuid ?? cancelVars?.orderUuid ?? null)
      : null

  return { onConfirm, onCancel, pendingUuid }
}
