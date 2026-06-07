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
import type { OrderFbsItem } from '@/types/orders'
import type { ClientInfoItem } from '@/types/orders-client-info'

interface OrdersTableRowProps {
  order: OrderFbsItem
  onClick: (order: OrderFbsItem) => void
  /** Story 86.2: client PII for this row (Owner only) */
  clientInfo?: ClientInfoItem
  /** Story 86.2: render the client cell (matches parent table's column visibility) */
  showClientColumn?: boolean
}

/**
 * OrdersTableRow - Single row in orders table
 */
export function OrdersTableRow({
  order,
  onClick,
  clientInfo,
  showClientColumn = false,
}: OrdersTableRowProps) {
  const productName = order.productName || '—'

  const handleClick = () => onClick(order)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(order)
    }
  }

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Заказ ${order.orderId}`}
    >
      {/* Order ID */}
      <TableCell className="font-medium">{order.orderId}</TableCell>

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

      {/* Created At */}
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateTime(order.createdAt)}
      </TableCell>

      {/* Updated At */}
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateTime(order.statusUpdatedAt)}
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
