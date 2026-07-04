/**
 * CancelOrderDialog — destructive confirm gate for cancelling an order.
 * Epic Moysklad, Story O3 (POST /v1/orders/:uuid/cancel → {canceled:true}).
 *
 * Rendered by OrderActionsCell when the operator picks «Отменить». Cancelling
 * is irreversible (backend WB SDK cancel → CANCELLED), so it is gated behind
 * an AlertDialog rather than firing directly from the menu item.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Story O3)
 */

'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { OrderFbsItem } from '@/types/orders'

interface CancelOrderDialogProps {
  /** The order being cancelled, or null when closed. */
  order: OrderFbsItem | null
  /** Controlled open state. */
  open: boolean
  /** True while the cancel mutation is in-flight (disables both buttons). */
  pending?: boolean
  /** Fires with the order UUID when the operator confirms. */
  onCancel: (orderUuid: string) => void
  /** Closes the dialog (escape / overlay / «Не отменять»). */
  onClose: () => void
}

/**
 * Destructive confirm dialog for order cancellation.
 */
export function CancelOrderDialog({
  order,
  open,
  pending = false,
  onCancel,
  onClose,
}: CancelOrderDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose()
      }}
    >
      <AlertDialogContent data-testid="cancel-order-dialog" onClick={e => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Отменить заказ?</AlertDialogTitle>
          <AlertDialogDescription>
            Заказ {order?.orderId ?? ''} будет отменён. Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} data-testid="cancel-order-dismiss">
            Не отменять
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || !order}
            onClick={() => {
              if (order) onCancel(order.id)
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="cancel-order-confirm"
          >
            {pending ? 'Отмена…' : 'Отменить заказ'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
