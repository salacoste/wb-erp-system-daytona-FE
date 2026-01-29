/**
 * Order Modal Header Component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays order header info: ID, product name, article, status, prices, date.
 */

'use client'

import { Package } from 'lucide-react'
import type { OrderFbsDetails } from '@/types/orders'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getWbStatusConfig } from '@/lib/wb-status-mapping'
import { cn } from '@/lib/utils'

export interface OrderModalHeaderProps {
  order: OrderFbsDetails
}

/**
 * Order header in modal - displays key order info
 * - Order ID (large text)
 * - Current status badge with color from wb-status-mapping
 * - nmId with link to WB product page
 * - Article (vendor code)
 * - Price with sale price (strikethrough original if different)
 * - Created date in Russian format
 */
export function OrderModalHeader({ order }: OrderModalHeaderProps) {
  const statusConfig = getWbStatusConfig(order.wbStatus)
  const hasSaleDiscount = order.salePrice < order.price

  // WB product link: https://www.wildberries.ru/catalog/{nmId}/detail.aspx
  const wbProductUrl = `https://www.wildberries.ru/catalog/${order.nmId}/detail.aspx`

  return (
    <div className="flex gap-4 pb-4 border-b mb-4">
      {/* Product Image Placeholder */}
      <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md flex items-center justify-center">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Order Info */}
      <div className="flex-1 min-w-0">
        {/* Product Name */}
        <h3 className="font-medium text-sm line-clamp-2 mb-1">
          {order.productName ?? 'Название не указано'}
        </h3>

        {/* Vendor Code (Article) */}
        <p className="text-xs text-muted-foreground mb-1">
          Артикул: <span className="font-mono">{order.vendorCode}</span>
        </p>

        {/* Order ID */}
        <p className="text-lg font-semibold text-primary mb-2">Заказ #{order.orderId}</p>

        {/* Price Row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold">{formatCurrency(order.salePrice)}</span>
          {hasSaleDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(order.price)}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              statusConfig.bgColor,
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Right Column: Date & Link */}
      <div className="flex-shrink-0 text-right text-sm">
        <p className="text-muted-foreground mb-1">Создан: {formatDateTime(order.createdAt)}</p>
        <a
          href={wbProductUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-xs"
        >
          nmId: {order.nmId}
        </a>
      </div>
    </div>
  )
}

/**
 * Format date as DD.MM.YYYY HH:mm
 */
function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  const day = formatDate(date)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day} ${hours}:${minutes}`
}
