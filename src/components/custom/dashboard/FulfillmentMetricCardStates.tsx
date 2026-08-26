/**
 * FulfillmentMetricCard state components - Loading, Error, NotImplemented, NoData
 * Extracted from FulfillmentMetricCard.tsx for file size compliance
 * Epic 60: FBO/FBS Order Analytics Separation
 */

import { Package, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface StateBaseProps {
  baseClass: string
}

export function LoadingState({ baseClass }: StateBaseProps) {
  return (
    <article className={baseClass} aria-busy="true" aria-label="Загрузка данных о заказах FBO/FBS">
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-10 w-24 mb-4" />
      <Skeleton className="h-4 w-full" />
    </article>
  )
}

export function NotImplementedState({ baseClass }: StateBaseProps) {
  return (
    <article className={baseClass} aria-label="Заказы FBO/FBS - скоро">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Package className="h-5 w-5" />
        <span className="font-medium">Заказы FBO/FBS</span>
      </div>
      <p className="text-sm text-status-warning font-medium">Скоро</p>
      <p className="text-xs text-muted-foreground mt-1">Функция в разработке</p>
    </article>
  )
}

interface ErrorStateProps extends StateBaseProps {
  onRetry?: () => void
}

export function ErrorFulfillmentState({ baseClass, onRetry }: ErrorStateProps) {
  return (
    <article className={baseClass} aria-label="Ошибка загрузки данных FBO/FBS">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Package className="h-5 w-5" />
        <span className="font-medium">Заказы FBO/FBS</span>
      </div>
      <div role="alert" className="text-destructive text-sm">
        Ошибка загрузки данных
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2"
          aria-label="Повторить загрузку"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Повторить
        </Button>
      )}
    </article>
  )
}

interface NoDataStateProps extends StateBaseProps {
  onStartSync?: () => void
  isSyncLoading?: boolean
}

export function NoDataState({ baseClass, onStartSync, isSyncLoading = false }: NoDataStateProps) {
  return (
    <article className={baseClass} aria-label="Данные FBO/FBS недоступны">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Package className="h-5 w-5" />
        <span className="font-medium">Заказы FBO/FBS</span>
      </div>
      <p className="text-sm text-muted-foreground">Нет данных</p>
      {onStartSync && (
        <Button
          variant="outline"
          size="sm"
          onClick={onStartSync}
          disabled={isSyncLoading}
          className="mt-2"
          aria-label="Синхронизировать данные"
        >
          <RefreshCw className={cn('h-4 w-4 mr-1', isSyncLoading && 'animate-spin')} />
          {isSyncLoading ? 'Загрузка...' : 'Синхронизировать'}
        </Button>
      )}
    </article>
  )
}
