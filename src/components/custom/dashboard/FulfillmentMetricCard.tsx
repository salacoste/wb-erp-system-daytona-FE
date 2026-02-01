/**
 * FulfillmentMetricCard Component - FBO/FBS fulfillment metrics card
 * Epic 60: FBO/FBS Order Analytics Separation
 */

'use client'

import { Info, RefreshCw, Package } from 'lucide-react'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface FulfillmentMetricCardProps {
  fboOrdersCount?: number
  fboOrdersRevenue?: number
  fbsOrdersCount?: number
  fbsOrdersRevenue?: number
  fboShare?: number
  fbsShare?: number
  isDataAvailable?: boolean
  isLoading?: boolean
  isSyncLoading?: boolean
  error?: Error | null
  previousFboOrdersCount?: number
  previousFbsOrdersCount?: number
  previousTotalRevenue?: number
  onRetry?: () => void
  onStartSync?: () => void
  className?: string
}

export function FulfillmentMetricCard({
  fboOrdersCount = 0,
  fboOrdersRevenue = 0,
  fbsOrdersCount = 0,
  fbsOrdersRevenue = 0,
  fboShare = 0,
  fbsShare = 0,
  isDataAvailable = false,
  isLoading = false,
  isSyncLoading = false,
  error = null,
  previousFboOrdersCount,
  previousFbsOrdersCount,
  previousTotalRevenue: _previousTotalRevenue,
  onRetry,
  onStartSync,
  className,
}: FulfillmentMetricCardProps) {
  const totalOrders = fboOrdersCount + fbsOrdersCount
  const totalRevenue = fboOrdersRevenue + fbsOrdersRevenue
  const hasPrevious = previousFboOrdersCount !== undefined && previousFbsOrdersCount !== undefined
  const previousTotal = hasPrevious ? previousFboOrdersCount + previousFbsOrdersCount : undefined
  const pctChange =
    hasPrevious && previousTotal ? ((totalOrders - previousTotal) / previousTotal) * 100 : null

  const baseClass = cn('min-h-[120px] rounded-lg border bg-card p-4', className)

  if (isLoading) {
    return (
      <article
        className={baseClass}
        aria-busy="true"
        aria-label="Загрузка данных о заказах FBO/FBS"
      >
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-10 w-24 mb-4" />
        <Skeleton className="h-4 w-full" />
      </article>
    )
  }

  // Check if error is 404 NOT_FOUND (backend not deployed yet)
  const isNotImplemented =
    error?.message?.includes('NOT_FOUND') || error?.message?.includes('Cannot GET')

  if (error && isNotImplemented) {
    return (
      <article className={baseClass} aria-label="Заказы FBO/FBS - скоро">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Package className="h-5 w-5" />
          <span className="font-medium">Заказы FBO/FBS</span>
        </div>
        <p className="text-sm text-amber-600 font-medium">Скоро</p>
        <p className="text-xs text-muted-foreground mt-1">Функция в разработке</p>
      </article>
    )
  }

  if (error) {
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

  if (!isDataAvailable) {
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

  return (
    <article
      className={cn(
        baseClass,
        'hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-ring'
      )}
      aria-label={`Заказы FBO/FBS: всего ${totalOrders} заказов`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-sm">Заказы FBO/FBS</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Подробнее">
              <Info className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent role="tooltip">
            <p>FBO - заказы со склада WB</p>
            <p>FBS - заказы со склада продавца</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold">{totalOrders.toLocaleString('ru-RU')}</span>
        {pctChange !== null && (
          <span
            data-testid="comparison-badge"
            className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              pctChange > 0.5
                ? 'bg-green-100 text-green-700'
                : pctChange < -0.5
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
            )}
          >
            {pctChange > 0 ? '+' : ''}
            {formatPercentage(pctChange)}
          </span>
        )}
      </div>

      <div className="text-sm text-muted-foreground mb-3">{formatCurrency(totalRevenue)}</div>

      <div
        className="h-2 rounded-full overflow-hidden flex"
        role="progressbar"
        aria-label="Распределение FBO/FBS"
      >
        <div
          data-testid="fbo-bar"
          data-type="fbo"
          className="bg-blue-500 h-full"
          style={{ width: `${fboShare}%` }}
        />
        <div
          data-testid="fbs-bar"
          data-type="fbs"
          className="bg-purple-500 h-full"
          style={{ width: `${fbsShare}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>
          FBO: {fboOrdersCount} ({formatPercentage(fboShare)})
        </span>
        <span>
          FBS: {fbsOrdersCount} ({formatPercentage(fbsShare)})
        </span>
      </div>
    </article>
  )
}
