'use client'

/**
 * RemoveOrderDialog Component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Confirmation dialog for removing an order from a supply.
 */

import { useEffect, useRef, type RefObject } from 'react'
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
  fallbackFocusRef?: RefObject<HTMLElement | null>
}

export function RemoveOrderDialog({
  isOpen,
  order,
  onConfirm,
  onCancel,
  isLoading = false,
  fallbackFocusRef,
}: RemoveOrderDialogProps) {
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) return

    const rememberFocus = () => {
      if (document.activeElement instanceof HTMLElement) {
        if (document.activeElement.closest('[role="dialog"], [role="alertdialog"]')) return
        returnFocusRef.current = document.activeElement
      }
    }

    rememberFocus()
    document.addEventListener('focusin', rememberFocus)
    return () => document.removeEventListener('focusin', rememberFocus)
  }, [isOpen])

  if (!order) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={open => !open && !isLoading && onCancel()}>
      <AlertDialogContent
        onOpenAutoFocus={() => {
          if (document.activeElement instanceof HTMLElement) {
            returnFocusRef.current = document.activeElement
          }
        }}
        onCloseAutoFocus={event => {
          const focusTarget = returnFocusRef.current?.isConnected
            ? returnFocusRef.current
            : fallbackFocusRef?.current
          if (!focusTarget) return
          event.preventDefault()
          focusTarget.focus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить заказ?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>Вы уверены, что хотите удалить этот заказ из поставки?</p>
              <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">ID:</span>{' '}
                  <span className="font-mono">{order.orderId}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Артикул:</span> {order.vendorCode}
                </p>
                {order.productName && (
                  <p>
                    <span className="text-muted-foreground">Товар:</span> {order.productName}
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">Цена:</span>{' '}
                  {order.salePrice != null ? formatCurrency(order.salePrice) : '—'}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <span className="sr-only" role="status" aria-live="polite">
          {isLoading ? 'Заказ удаляется из поставки' : ''}
        </span>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={event => {
              event.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
