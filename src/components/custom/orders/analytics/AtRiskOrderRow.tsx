'use client'

/**
 * AtRiskOrderRow Component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Single at-risk order row with countdown and status display.
 */

import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <Button
      type="button"
      variant="outline"
      className={cn(
        // Story 172.14-FE: raw button → ui Button (outline); h-auto/p-3/text-left
        // override the h-9/px-4/whitespace-nowrap defaults that break the row
        // layout (172.9 lesson (c)); hover:text-foreground neutralizes the
        // outline variant hover shift the un-colored orderId never had (pass-1).
        'flex h-auto w-full items-center justify-between whitespace-normal rounded-lg border p-3 text-left font-normal shadow-none transition-colors',
        'cursor-pointer hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/20',
        isBreached && 'border-status-error/30 bg-status-error/10'
      )}
      onClick={() => onClick?.(order.orderId)}
      data-testid={`at-risk-order-row-${order.orderId}`}
      data-order-id={order.orderId}
      aria-label={`Заказ ${order.orderId}, ${isBreached ? 'просрочен' : `${order.minutesRemaining} минут до нарушения`}`}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">#{order.orderId}</span>
        <span className="text-xs text-muted-foreground">{order.currentStatus}</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-xs text-muted-foreground">{riskTypeLabel}</span>
        <span
          className={cn('font-medium', countdownColor)}
          data-testid={`countdown-${order.orderId}`}
          aria-live="polite"
        >
          {isBreached ? 'Просрочен' : formatDuration(order.minutesRemaining)}
        </span>
        {isBreached && (
          <XCircle className="h-4 w-4 text-status-error" data-testid="breached-indicator" />
        )}
      </div>
    </Button>
  )
}
