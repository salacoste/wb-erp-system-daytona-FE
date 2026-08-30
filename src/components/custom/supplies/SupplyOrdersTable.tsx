'use client'

/**
 * SupplyOrdersTable Component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Displays orders in a supply with remove capability.
 */

import { useRef, useState } from 'react'
import { Package, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { RemoveOrderDialog } from './RemoveOrderDialog'
import type { SupplyOrder, SupplyStatus } from '@/types/supplies'

interface SupplyOrdersTableProps {
  orders: SupplyOrder[]
  supplyId: string
  status: SupplyStatus
  onRemoveOrder: (orderIds: string[], onSuccess: () => void) => void
  onOrderClick?: (order: SupplyOrder) => void
  isRemoving?: boolean
}

/** Get supplier status badge styling */
function getSupplierStatusBadge(supplierStatus: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    confirm: {
      label: 'Подтверждён',
      className: 'border-status-information/30 bg-status-information/10 text-status-information',
    },
    complete: {
      label: 'Готов',
      className: 'border-status-success/30 bg-status-success/10 text-status-success',
    },
    cancel: {
      label: 'Отменён',
      className: 'border-status-error/30 bg-status-error/10 text-status-error',
    },
  }
  const config = statusMap[supplierStatus] || { label: supplierStatus, className: 'bg-muted/50' }
  return config
}

export function SupplyOrdersTable({
  orders,
  status,
  onRemoveOrder,
  onOrderClick,
  isRemoving = false,
}: SupplyOrdersTableProps) {
  const [orderToRemove, setOrderToRemove] = useState<SupplyOrder | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const focusFallbackRef = useRef<HTMLDivElement>(null)
  const canRemove = status === 'OPEN'

  const handleRemoveClick = (order: SupplyOrder, e: React.MouseEvent) => {
    e.stopPropagation()
    setOrderToRemove(order)
    setIsRemoveDialogOpen(true)
  }

  const handleConfirmRemove = () => {
    if (orderToRemove) {
      onRemoveOrder([orderToRemove.orderId], () => setIsRemoveDialogOpen(false))
    }
  }

  return (
    <div
      ref={focusFallbackRef}
      tabIndex={-1}
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {orders.length === 0 ? (
        <div className="rounded-lg border bg-card p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-lg font-medium text-muted-foreground">В поставке пока нет заказов</p>
            {status === 'OPEN' && (
              <p className="mt-1 text-sm text-muted-foreground">
                Добавьте заказы, чтобы начать сборку поставки
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <caption className="sr-only">Заказы в поставке</caption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">ID заказа</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead className="w-[100px] text-right">Цена</TableHead>
                  <TableHead className="w-[120px]">Статус</TableHead>
                  <TableHead className="w-[150px]">Добавлен</TableHead>
                  {canRemove && (
                    <TableHead className="w-[80px]">
                      <span className="sr-only">Действия</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  const statusConfig = getSupplierStatusBadge(order.supplierStatus)
                  return (
                    <TableRow
                      key={order.orderId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onOrderClick?.(order)}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.target !== e.currentTarget) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onOrderClick?.(order)
                        }
                      }}
                    >
                      <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.vendorCode}</span>
                          <span className="text-sm text-muted-foreground">
                            {order.productName || '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {order.salePrice != null ? formatCurrency(order.salePrice) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(order.addedAt)}
                      </TableCell>
                      {canRemove && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => handleRemoveClick(order, e)}
                            disabled={isRemoving}
                            aria-label={`Удалить заказ ${order.orderId}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <RemoveOrderDialog
        isOpen={isRemoveDialogOpen}
        order={orderToRemove}
        onConfirm={handleConfirmRemove}
        onCancel={() => setIsRemoveDialogOpen(false)}
        isLoading={isRemoving}
        fallbackFocusRef={focusFallbackRef}
      />
    </div>
  )
}
