'use client'

/**
 * SupplyOrdersTable Component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Displays orders in a supply with remove capability.
 */

import { useState } from 'react'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { RemoveOrderDialog } from './RemoveOrderDialog'
import type { SupplyOrder, SupplyStatus } from '@/types/supplies'

interface SupplyOrdersTableProps {
  orders: SupplyOrder[]
  supplyId: string
  status: SupplyStatus
  onRemoveOrder: (orderIds: string[]) => void
  onOrderClick?: (order: SupplyOrder) => void
  isRemoving?: boolean
}

/** Get supplier status badge styling */
function getSupplierStatusBadge(supplierStatus: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    confirm: { label: 'Подтверждён', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    complete: { label: 'Готов', className: 'bg-green-50 text-green-700 border-green-200' },
    cancel: { label: 'Отменён', className: 'bg-red-50 text-red-700 border-red-200' },
  }
  const config = statusMap[supplierStatus] || { label: supplierStatus, className: 'bg-gray-50' }
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
  const canRemove = status === 'OPEN'

  const handleRemoveClick = (order: SupplyOrder, e: React.MouseEvent) => {
    e.stopPropagation()
    setOrderToRemove(order)
  }

  const handleConfirmRemove = () => {
    if (orderToRemove) {
      onRemoveOrder([orderToRemove.orderId])
      setOrderToRemove(null)
    }
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Package className="mb-4 h-12 w-12 text-gray-300" aria-hidden="true" />
          <p className="text-lg font-medium text-gray-500">В поставке пока нет заказов</p>
          {status === 'OPEN' && (
            <p className="mt-1 text-sm text-gray-400">
              Добавьте заказы, чтобы начать сборку поставки
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID заказа</TableHead>
                <TableHead>Товар</TableHead>
                <TableHead className="w-[100px] text-right">Цена</TableHead>
                <TableHead className="w-[120px]">Статус</TableHead>
                <TableHead className="w-[150px]">Добавлен</TableHead>
                {canRemove && <TableHead className="w-[80px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => {
                const statusConfig = getSupplierStatusBadge(order.supplierStatus)
                return (
                  <TableRow
                    key={order.orderId}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onOrderClick?.(order)}
                    tabIndex={0}
                    onKeyDown={e => {
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
                        <span className="text-sm text-gray-500">{order.productName || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.salePrice)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {(() => {
                        const date = new Date(order.addedAt)
                        const hours = date.getHours().toString().padStart(2, '0')
                        const minutes = date.getMinutes().toString().padStart(2, '0')
                        return `${formatDate(date)} ${hours}:${minutes}`
                      })()}
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
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      <RemoveOrderDialog
        isOpen={!!orderToRemove}
        order={orderToRemove}
        onConfirm={handleConfirmRemove}
        onCancel={() => setOrderToRemove(null)}
        isLoading={isRemoving}
      />
    </>
  )
}
