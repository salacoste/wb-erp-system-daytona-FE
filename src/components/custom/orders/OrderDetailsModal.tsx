/**
 * Order Details Modal Component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Main modal for viewing order details with tabbed history views.
 * Uses shadcn Dialog with max-width 700px and on-demand data fetching.
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getOrderById, ordersQueryKeys } from '@/lib/api/orders'
import { OrderModalHeader } from './OrderModalHeader'
import { OrderHistoryTabs } from './OrderHistoryTabs'
import { ModalLoadingSkeleton } from './ModalLoadingSkeleton'

export interface OrderDetailsModalProps {
  /** Order ID to display, null = modal closed */
  orderId: string | null
  /** Callback when modal should close */
  onClose: () => void
}

const MODAL_TITLE_ID = 'order-details-modal-title'

/**
 * Order Details Modal with tabbed history views
 * - Fetches order details when orderId changes
 * - On-demand history fetching per tab
 * - Loading/error states with retry
 */
export function OrderDetailsModal({ orderId, onClose }: OrderDetailsModalProps) {
  const isOpen = orderId !== null

  const {
    data: orderDetails,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ordersQueryKeys.detail(orderId ?? ''),
    queryFn: () => getOrderById(orderId!),
    enabled: isOpen && !!orderId,
    staleTime: 30_000,
    gcTime: 300_000,
    retry: 1,
  })

  // Check for 404 error
  const is404 = error && typeof error === 'object' && 'status' in error && error.status === 404

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-[700px] max-h-[90vh] overflow-y-auto"
        aria-labelledby={MODAL_TITLE_ID}
      >
        <DialogHeader className="sr-only">
          <DialogTitle id={MODAL_TITLE_ID}>
            {orderDetails ? `Заказ #${orderDetails.orderId}` : 'Детали заказа'}
          </DialogTitle>
        </DialogHeader>

        <div aria-busy={isLoading} data-testid="modal-content">
          {isLoading && <ModalLoadingSkeleton data-testid="modal-loading-skeleton" />}

          {isError && !isLoading && (
            <ErrorState is404={is404 ?? false} onRetry={() => refetch()} onClose={onClose} />
          )}

          {orderDetails && !isLoading && !isError && (
            <>
              <OrderModalHeader order={orderDetails} />
              <OrderHistoryTabs orderId={orderId!} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ErrorStateProps {
  is404: boolean
  onRetry: () => void
  onClose: () => void
}

function ErrorState({ is404, onRetry, onClose }: ErrorStateProps) {
  if (is404) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          Заказ не найден
          <Button variant="outline" size="sm" className="ml-4" onClick={onClose}>
            Закрыть
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="ml-2 flex items-center gap-2">
        Не удалось загрузить данные.
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4 mr-1" />
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}
