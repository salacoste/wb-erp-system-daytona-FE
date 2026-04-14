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
import { AlertTriangle } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { getWbStatusConfig } from '@/lib/wb-status-mapping'
import { OrderStatusBadge } from './OrderStatusBadge'
import { ClientInfoCell } from './ClientInfoCell'
import type { OrderFbsItem } from '@/types/orders'
import type { ClientInfoItem } from '@/types/orders-client-info'

/**
 * Detect anomalous salePrice > price inversion from WB data.
 * Threshold chosen at 1.2x — legitimate price adjustments (e.g., currency rounding,
 * promo stacking) stay under this; observed bad data (order 4909080943) was 27x.
 * See docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md for backend tracking.
 */
function isPriceInverted(price: number, salePrice: number): boolean {
  return price > 0 && salePrice > price * 1.2
}

interface OrdersTableRowProps {
  order: OrderFbsItem
  onClick: (order: OrderFbsItem) => void
  /** Story 86.2: client PII for this row (Owner only) */
  clientInfo?: ClientInfoItem
  /** Story 86.2: render the client cell (matches parent table's column visibility) */
  showClientColumn?: boolean
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
export function OrdersTableRow({
  order,
  onClick,
  clientInfo,
  showClientColumn = false,
}: OrdersTableRowProps) {
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

      {/* Sale Price — Story 87.3-FE: anomaly indicator when salePrice > price * 1.2 */}
      <TableCell className="text-right">
        {isPriceInverted(order.price, order.salePrice) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  {formatCurrency(order.salePrice)}
                  <AlertTriangle
                    className="h-3.5 w-3.5 text-amber-500"
                    aria-label={`Аномалия: цена продажи выше оригинальной цены в ${(order.salePrice / order.price).toFixed(1)} раз. Возможна ошибка данных на стороне WB.`}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Аномалия: цена продажи выше оригинальной цены в{' '}
                  {(order.salePrice / order.price).toFixed(1)} раз. Возможна ошибка данных на
                  стороне WB.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          formatCurrency(order.salePrice)
        )}
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
