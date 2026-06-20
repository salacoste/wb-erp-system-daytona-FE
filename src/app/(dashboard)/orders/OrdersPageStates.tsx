'use client'

/**
 * Orders page loading & error state components
 * Extracted from orders/page.tsx for file size compliance
 * Story 40.3-FE: Orders List Page
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock } from 'lucide-react'
import { OrdersPageHeader, OrdersLoadingSkeleton } from '@/components/custom/orders'

interface HeaderProps {
  lastSyncAt: string | null
  isSyncing: boolean
  onSync: () => void
}

export function OrdersLoadingState({ headerProps }: { headerProps: HeaderProps }) {
  return (
    <div className="space-y-6">
      <OrdersPageHeader
        lastSyncAt={headerProps.lastSyncAt}
        isSyncing={headerProps.isSyncing}
        onSync={headerProps.onSync}
      />
      <OrdersLoadingSkeleton />
    </div>
  )
}

export function OrdersSlowLoadingState({
  headerProps,
  onRetry,
}: {
  headerProps: HeaderProps
  onRetry: () => void
}) {
  return (
    <div className="space-y-6" data-testid="orders-slow-loading-state">
      <OrdersPageHeader
        lastSyncAt={headerProps.lastSyncAt}
        isSyncing={headerProps.isSyncing}
        onSync={headerProps.onSync}
      />
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>
            Заказы загружаются дольше обычного. Можно повторить запрос или проверить позже.
          </span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export function OrdersErrorState({
  headerProps,
  error,
  onRetry,
}: {
  headerProps: HeaderProps
  error: unknown
  onRetry: () => void
}) {
  return (
    <div className="space-y-6">
      <OrdersPageHeader
        lastSyncAt={headerProps.lastSyncAt}
        isSyncing={headerProps.isSyncing}
        onSync={headerProps.onSync}
      />
      <Alert variant="destructive" data-testid="orders-error-state">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error instanceof Error ? error.message : 'Ошибка загрузки заказов'}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
