/**
 * FBO Orders Table — displays paginated list of FBO orders.
 * Russian locale. Uses formatCurrency for price columns.
 */

'use client'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { OrderFboItem } from '@/types/orders-fbo'

interface FboOrdersTableProps {
  orders: OrderFboItem[]
  isLoading: boolean
  page: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  /** Optional — table caption naming the source (RTC contract, Story 172.15-FE) */
  captionText?: string
}

export function FboOrdersTable({
  orders,
  isLoading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  captionText,
}: FboOrdersTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Загрузка заказов...</span>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground" data-testid="fbo-orders-empty">
        Нет заказов за выбранный период
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Всего: {totalCount.toLocaleString('ru-RU')}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          {/* Story 172.15: caption names the source (RTC); spec-order above header,
              visually bottom via ui Table caption-bottom (171.9 canon). */}
          {captionText ? <TableCaption>{captionText}</TableCaption> : null}
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Артикул</TableHead>
              <TableHead>Бренд</TableHead>
              <TableHead>Предмет</TableHead>
              <TableHead>Склад</TableHead>
              <TableHead className="text-right">Цена</TableHead>
              <TableHead className="text-right">Итого</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id} data-testid={`fbo-order-${order.orderId}`}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatDate(order.orderDate)}
                </TableCell>
                <TableCell>{order.nmId}</TableCell>
                <TableCell className="max-w-[120px] truncate">{order.brand}</TableCell>
                <TableCell className="max-w-[200px] truncate">{order.subject}</TableCell>
                <TableCell className="max-w-[120px] truncate">{order.warehouseName}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCurrency(order.totalPrice)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCurrency(order.finishedPrice)}
                </TableCell>
                <TableCell>
                  {order.isCancel ? (
                    <Badge variant="destructive">Отменён</Badge>
                  ) : (
                    <Badge variant="default">Активен</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Стр. {page} из {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Предыдущая страница"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Следующая страница"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
