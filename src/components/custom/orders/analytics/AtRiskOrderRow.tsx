'use client'

/**
 * AtRiskOrderRow Component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Single at-risk order row with countdown and status display.
 */

import { XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration, getCountdownColor } from '@/lib/analytics-utils'
import type { AtRiskOrder } from '@/types/orders-analytics'

interface AtRiskOrderRowProps {
  order: AtRiskOrder
  onClick?: (orderId: string) => void
}

/**
 * AtRiskOrderRow - Single at-risk order row component
 */
export function AtRiskOrderRow({ order, onClick }: AtRiskOrderRowProps) {
  const countdownColor = getCountdownColor(order.minutesRemaining)
  const isBreached = order.isBreached || order.minutesRemaining < 0
  const riskTypeLabel = order.riskType === 'confirmation' ? 'Подтверждение' : 'Выполнение'

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors',
        'cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20',
        isBreached && 'border-red-200 bg-red-50'
      )}
      onClick={() => onClick?.(order.orderId)}
      data-testid={`at-risk-order-row-${order.orderId}`}
      data-order-id={order.orderId}
      role="button"
      aria-label={`Заказ ${order.orderId}, ${isBreached ? 'просрочен' : `${order.minutesRemaining} минут до нарушения`}`}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">#{order.orderId}</span>
        <span className="text-xs text-gray-500">{order.currentStatus}</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-xs text-gray-500">{riskTypeLabel}</span>
        <span
          className={cn('font-medium', countdownColor)}
          data-testid={`countdown-${order.orderId}`}
          aria-live="polite"
        >
          {isBreached ? 'Просрочен' : formatDuration(order.minutesRemaining)}
        </span>
        {isBreached && (
          <XCircle className="h-4 w-4 text-red-500" data-testid="breached-indicator" />
        )}
      </div>
    </button>
  )
}
