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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { getWbStatusConfig } from '@/lib/wb-status-mapping'
import { OrderStatusBadge } from './OrderStatusBadge'
import type { OrderFbsItem } from '@/types/orders'

interface OrdersTableRowProps {
  order: OrderFbsItem
  onClick: (order: OrderFbsItem) => void
}

/**
 * Format date as "dd.MM.yyyy HH:mm"
 */
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${day}.${month}.${year} ${hours}:${minutes}`
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '—'
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * WB Status Badge using wb-status-mapping
 */
function WbStatusBadge({ status }: { status: string }) {
  const config = getWbStatusConfig(status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color,
        config.bgColor
      )}
    >
      {config.label}
    </span>
  )
}

/**
 * OrdersTableRow - Single row in orders table
 */
export function OrdersTableRow({ order, onClick }: OrdersTableRowProps) {
  const productName = order.productName || '—'
  const needsTruncation = productName.length > 40

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
          {needsTruncation ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-gray-600">{truncateText(productName, 40)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{productName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-xs text-gray-600">{productName}</span>
          )}
        </div>
      </TableCell>

      {/* Price */}
      <TableCell className="text-right">{formatCurrency(order.price)}</TableCell>

      {/* Sale Price */}
      <TableCell className="text-right">{formatCurrency(order.salePrice)}</TableCell>

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
    </TableRow>
  )
}
