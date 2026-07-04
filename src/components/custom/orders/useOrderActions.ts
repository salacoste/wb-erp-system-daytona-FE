/**
 * useOrderActions — Stories O2 / O3 / O4 controller hook.
 * Wraps the per-row order-action mutations (confirm, cancel, marking-code meta)
 * and exposes stable handlers + the in-flight order UUID for per-row
 * disabling. Mirrors useOrderOperationalStatus (Story O1). Extracted from the
 * orders page for the 200-line source cap.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Stories O2–O4)
 */

'use client'

import { useConfirmOrder, useCancelOrder, useUpdateOrderMeta } from '@/hooks/useOrders'
import type { UpdateOrderMetaBody } from '@/types/orders-actions'

/** Confirm-handler signature (uuid of the order to confirm). */
export type ConfirmOrderHandler = (orderUuid: string) => void

/** Cancel-handler signature (uuid of the order to cancel). */
export type CancelOrderHandler = (orderUuid: string) => void

/** Marking-code save-handler signature (uuid + body). */
export type SaveOrderMetaHandler = (orderUuid: string, body: UpdateOrderMetaBody) => void

/** Controller shape consumed by the orders table actions cell. */
export interface OrderActionsController {
  onConfirm: ConfirmOrderHandler
  onCancel: CancelOrderHandler
  onSaveMeta: SaveOrderMetaHandler
  /** OrderFbs UUID currently being acted upon, or null when idle. */
  pendingUuid: string | null
}

/**
 * Returns stable action handlers + the in-flight order UUID. `pendingUuid`
 * reflects whichever mutation (confirm / cancel / meta) is currently active.
 */
export function useOrderActions(): OrderActionsController {
  const { mutate: confirm, variables: confirmVars, isPending: confirmPending } = useConfirmOrder()
  const { mutate: cancel, variables: cancelVars, isPending: cancelPending } = useCancelOrder()
  const { mutate: saveMeta, variables: metaVars, isPending: metaPending } = useUpdateOrderMeta()

  const onConfirm: ConfirmOrderHandler = orderUuid => {
    confirm({ orderUuid })
  }
  const onCancel: CancelOrderHandler = orderUuid => {
    cancel({ orderUuid })
  }
  const onSaveMeta: SaveOrderMetaHandler = (orderUuid, body) => {
    saveMeta({ orderUuid, body })
  }

  const pendingUuid =
    confirmPending || cancelPending || metaPending
      ? (confirmVars?.orderUuid ?? cancelVars?.orderUuid ?? metaVars?.orderUuid ?? null)
      : null

  return { onConfirm, onCancel, onSaveMeta, pendingUuid }
}
