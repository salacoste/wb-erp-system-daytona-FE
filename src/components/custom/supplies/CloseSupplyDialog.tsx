'use client'

/**
 * CloseSupplyDialog Component
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Confirmation dialog for closing a supply.
 * Validates that supply is not empty before closing.
 */

import { AlertTriangle, Loader2 } from 'lucide-react'
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
import { useCloseSupply } from '@/hooks/useCloseSupply'

/**
 * Russian plural forms for "заказ" (order)
 * 1 заказ, 2-4 заказа, 5+ заказов
 */
function getOrderCountText(count: number): string {
  const absCount = Math.abs(count)
  const lastTwo = absCount % 100
  const lastOne = absCount % 10

  if (lastTwo >= 11 && lastTwo <= 19) {
    return `${count} заказов`
  }
  if (lastOne === 1) {
    return `${count} заказ`
  }
  if (lastOne >= 2 && lastOne <= 4) {
    return `${count} заказа`
  }
  return `${count} заказов`
}

interface CloseSupplyDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Supply ID to close */
  supplyId: string
  /** Number of orders in the supply */
  ordersCount: number
  /** Optional callback on successful close */
  onSuccess?: () => void
}

export function CloseSupplyDialog({
  open,
  onOpenChange,
  supplyId,
  ordersCount,
  onSuccess,
}: CloseSupplyDialogProps) {
  const { mutate: closeSupplyMutation, isPending } = useCloseSupply({
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
  })

  const handleConfirm = () => {
    closeSupplyMutation(supplyId)
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during loading
    if (!newOpen && isPending) {
      return
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" aria-hidden="true" />
            Закрыть поставку?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {/* Warning message */}
              <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800">
                После закрытия поставки вы не сможете добавлять или удалять заказы.
              </div>

              {/* Order count */}
              <p className="text-sm text-gray-600">
                В поставке:{' '}
                <span className="font-medium text-gray-900">{getOrderCountText(ordersCount)}</span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Закрытие...
              </>
            ) : (
              'Закрыть поставку'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
