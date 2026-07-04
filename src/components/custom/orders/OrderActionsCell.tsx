/**
 * OrderActionsCell — per-row actions dropdown for the orders table.
 * Epic Moysklad, Stories O2 / O3 / O4.
 *
 * Hosts the operator actions behind a kebab menu:
 *  - Подтвердить (O2): fires directly; enabled only for NEW.
 *  - Отменить (O3): destructive — opens CancelOrderDialog; enabled pre-shipment.
 *  - Код маркировки (O4): opens EditOrderMetaDialog; enabled for non-terminal.
 * The trigger disables while an action for this row is in-flight. The wrapper
 * stops propagation so menu/dialog interaction does not trigger the row's
 * open-details click.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Stories O2–O4)
 */

'use client'

import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CancelOrderDialog } from './CancelOrderDialog'
import { EditOrderMetaDialog } from './EditOrderMetaDialog'
import {
  CONFIRMABLE_STATUSES,
  CANCELLABLE_STATUSES,
  META_EDITABLE_STATUSES,
  type UpdateOrderMetaBody,
} from '@/types/orders-actions'
import type { OrderFbsItem } from '@/types/orders'

interface OrderActionsCellProps {
  order: OrderFbsItem
  /** Confirm-handler (Story O2). Omit to hide the confirm item. */
  onConfirm?: (orderUuid: string) => void
  /** Cancel-handler (Story O3). Omit to hide the cancel item + dialog. */
  onCancel?: (orderUuid: string) => void
  /** Marking-code save-handler (Story O4). Omit to hide the meta item + dialog. */
  onSaveMeta?: (orderUuid: string, body: UpdateOrderMetaBody) => void
  /** True while an action for THIS row is in-flight (disables the trigger). */
  pending?: boolean
}

/**
 * Renders the kebab actions menu for a single order row.
 */
export function OrderActionsCell({
  order,
  onConfirm,
  onCancel,
  onSaveMeta,
  pending = false,
}: OrderActionsCellProps) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)

  const confirmable = CONFIRMABLE_STATUSES.includes(order.operationalStatus)
  const cancellable = CANCELLABLE_STATUSES.includes(order.operationalStatus)
  const metaEditable = META_EDITABLE_STATUSES.includes(order.operationalStatus)

  return (
    <div onClick={e => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={pending}
            aria-label={`Действия с заказом ${order.orderId}`}
            data-testid={`order-actions-trigger-${order.orderId}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onConfirm && (
            <DropdownMenuItem
              disabled={!confirmable}
              onSelect={() => onConfirm(order.id)}
              data-testid={`order-confirm-${order.orderId}`}
            >
              Подтвердить
            </DropdownMenuItem>
          )}
          {onCancel && (
            <DropdownMenuItem
              disabled={!cancellable}
              onSelect={() => setCancelOpen(true)}
              className="text-destructive focus:text-destructive"
              data-testid={`order-cancel-${order.orderId}`}
            >
              Отменить
            </DropdownMenuItem>
          )}
          {onSaveMeta && (
            <DropdownMenuItem
              disabled={!metaEditable}
              onSelect={() => setMetaOpen(true)}
              data-testid={`order-meta-${order.orderId}`}
            >
              Код маркировки
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {onCancel && (
        <CancelOrderDialog
          order={cancelOpen ? order : null}
          open={cancelOpen}
          pending={pending}
          onCancel={orderUuid => {
            onCancel(orderUuid)
            setCancelOpen(false)
          }}
          onClose={() => setCancelOpen(false)}
        />
      )}

      {onSaveMeta && (
        <EditOrderMetaDialog
          order={metaOpen ? order : null}
          open={metaOpen}
          pending={pending}
          onSave={(orderUuid, body) => {
            onSaveMeta(orderUuid, body)
            setMetaOpen(false)
          }}
          onClose={() => setMetaOpen(false)}
        />
      )}
    </div>
  )
}
