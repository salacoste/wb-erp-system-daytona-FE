/**
 * FulfillmentMetricCard Component - FBO/FBS fulfillment metrics card
 * Epic 60: FBO/FBS Order Analytics Separation
 */

'use client'

import { Info, Package } from 'lucide-react'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  LoadingState,
  NotImplementedState,
  ErrorFulfillmentState,
  NoDataState,
} from './FulfillmentMetricCardStates'

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

  const baseClass = cn('min-h-[100px] rounded-lg border bg-card p-4', className)

  if (isLoading) return <LoadingState baseClass={baseClass} />

  const isNotImplemented =
    error?.message?.includes('NOT_FOUND') || error?.message?.includes('Cannot GET')

  if (error && isNotImplemented) return <NotImplementedState baseClass={baseClass} />
  if (error) return <ErrorFulfillmentState baseClass={baseClass} onRetry={onRetry} />
  if (!isDataAvailable) {
    return (
      <NoDataState baseClass={baseClass} onStartSync={onStartSync} isSyncLoading={isSyncLoading} />
    )
  }

  return (
    <article
      className={cn(
        baseClass,
        'hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-ring'
      )}
      aria-label={`Заказы FBO/FBS: всего ${totalOrders} заказов`}
      data-testid="metric-card"
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
        <span className="text-xl font-bold">{totalOrders.toLocaleString('ru-RU')}</span>
        {pctChange !== null && (
          <span
            data-testid="comparison-badge"
            className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              pctChange > 0.5
                ? 'bg-green-100 text-green-700'
                : pctChange < -0.5
                  ? 'bg-red-100 text-red-700'
                  : 'bg-muted text-muted-foreground'
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
