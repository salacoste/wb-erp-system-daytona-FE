'use client'

/**
 * RemoveOrderDialog Component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Confirmation dialog for removing an order from a supply.
 */

import { Loader2 } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'
import type { SupplyOrder } from '@/types/supplies'

interface RemoveOrderDialogProps {
  isOpen: boolean
  order: SupplyOrder | null
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function RemoveOrderDialog({
  isOpen,
  order,
  onConfirm,
  onCancel,
  isLoading = false,
}: RemoveOrderDialogProps) {
  if (!order) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={open => !open && !isLoading && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить заказ?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>Вы уверены, что хотите удалить этот заказ из поставки?</p>
              <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
                <p>
                  <span className="text-gray-500">ID:</span>{' '}
                  <span className="font-mono">{order.orderId}</span>
                </p>
                <p>
                  <span className="text-gray-500">Артикул:</span> {order.vendorCode}
                </p>
                {order.productName && (
                  <p>
                    <span className="text-gray-500">Товар:</span> {order.productName}
                  </p>
                )}
                <p>
                  <span className="text-gray-500">Цена:</span> {formatCurrency(order.salePrice)}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Удаление...
              </>
            ) : (
              'Удалить'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
