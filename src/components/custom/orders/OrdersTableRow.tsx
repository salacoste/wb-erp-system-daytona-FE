/**
 * OrdersTableRow Component
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Single table row for an order item with status badges.
 * Reference: docs/stories/epic-40/story-40.3-fe-orders-list-page.md#AC4
 */

'use client'

import Link from 'next/link'
import { TableRow, TableCell } from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { OrderStatusBadge } from './OrderStatusBadge'
import { ClientInfoCell } from './ClientInfoCell'
import { WbStatusBadge, SalePriceCell, ProductNameCell } from './OrdersRowHelpers'
import { OperationalStatusBadge } from './OperationalStatusBadge'
import { OperationalStatusSelect } from './OperationalStatusSelect'
import { OrderActionsCell } from './OrderActionsCell'
import type { OrderFbsItem, OrderOperationalStatus } from '@/types/orders'
import type { ClientInfoItem } from '@/types/orders-client-info'
import type { UpdateOrderMetaBody } from '@/types/orders-actions'

interface OrdersTableRowProps {
  order: OrderFbsItem
  onClick: (order: OrderFbsItem) => void
  /** Story 86.2: client PII for this row (Owner only) */
  clientInfo?: ClientInfoItem
  /** Story 86.2: render the client cell (matches parent table's column visibility) */
  showClientColumn?: boolean
  /** Story O1: change-operational-status handler (omit to hide the control) */
  onOperationalStatusChange?: (orderUuid: string, status: OrderOperationalStatus) => void
  /** Story O1: disable the control while a mutation is in-flight */
  operationalStatusPending?: boolean
  /** Story O2: confirm-handler (omit to hide the confirm action in the menu). */
  onConfirm?: (orderUuid: string) => void
  /** Story O3: cancel-handler (omit to hide the cancel action + dialog). */
  onCancel?: (orderUuid: string) => void
  /** Story O4: marking-code save-handler (omit to hide the meta action + dialog). */
  onSaveMeta?: (orderUuid: string, body: UpdateOrderMetaBody) => void
  /** Story O2: disable the actions menu while a mutation for this row is in-flight. */
  actionsPending?: boolean
}

/**
 * OrdersTableRow - Single row in orders table
 */
export function OrdersTableRow({
  order,
  onClick,
  clientInfo,
  showClientColumn = false,
  onOperationalStatusChange,
  operationalStatusPending = false,
  onConfirm,
  onCancel,
  onSaveMeta,
  actionsPending = false,
}: OrdersTableRowProps) {
  const productName = order.productName || '—'

  const handleClick = () => onClick(order)

  // AP#8: null until first transition → render «—».
  const operationalStatusUpdatedAtLabel = order.operationalStatusUpdatedAt
    ? formatDateTime(order.operationalStatusUpdatedAt)
    : '—'

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={handleClick}>
      {/* Order ID */}
      <TableCell className="font-medium">
        <div className="flex flex-col items-start gap-1">
          <span>{order.orderId}</span>
          <button
            type="button"
            className="inline-flex rounded px-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Открыть заказ ${order.orderId}`}
            onClick={e => {
              e.stopPropagation()
              onClick(order)
            }}
          >
            Открыть
          </button>
        </div>
      </TableCell>

      {/* Product Info */}
      <TableCell className="min-w-[200px]">
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/cogs?search=${order.nmId}`}
            className="text-sm font-medium text-primary hover:underline"
            onClick={e => e.stopPropagation()}
          >
            {order.nmId}
          </Link>
          <span className="text-xs text-muted-foreground">{order.vendorCode}</span>
          <ProductNameCell productName={productName} />
        </div>
      </TableCell>

      {/* Price */}
      <TableCell className="text-right">{formatCurrency(order.price)}</TableCell>

      {/* Sale Price — Story 87.3-FE: anomaly indicator when salePrice > price * 1.2 */}
      <TableCell className="text-right">
        <SalePriceCell price={order.price} salePrice={order.salePrice} />
      </TableCell>

      {/* Supplier Status */}
      <TableCell>
        <OrderStatusBadge status={order.supplierStatus} />
      </TableCell>

      {/* WB Status */}
      <TableCell>
        <WbStatusBadge status={order.wbStatus} />
      </TableCell>

      {/* Story O1: Operational Status — badge + (optional) change control */}
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <OperationalStatusBadge status={order.operationalStatus} />
          {onOperationalStatusChange && (
            <OperationalStatusSelect
              orderUuid={order.id}
              currentStatus={order.operationalStatus}
              disabled={operationalStatusPending}
              onStatusChange={onOperationalStatusChange}
            />
          )}
          <span className="text-xs text-muted-foreground">{operationalStatusUpdatedAtLabel}</span>
        </div>
      </TableCell>

      {/* Created At */}
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateTime(order.createdAt)}
      </TableCell>

      {/* Updated At */}
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateTime(order.statusUpdatedAt)}
      </TableCell>

      {/* Stories O2/O3/O4: per-row actions (confirm / cancel / marking-code meta) */}
      <TableCell className="text-right">
        <OrderActionsCell
          order={order}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onSaveMeta={onSaveMeta}
          pending={actionsPending}
        />
      </TableCell>

      {/* Story 86.2: Client (PII) — Owner only */}
      {showClientColumn && (
        <TableCell className="w-44">
          <ClientInfoCell info={clientInfo} />
        </TableCell>
      )}
    </TableRow>
  )
}
