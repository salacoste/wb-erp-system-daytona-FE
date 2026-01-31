'use client'

/**
 * Status Legend Component
 * Story 63.7-FE: Orders Status Breakdown Chart
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Legend component for status breakdown charts.
 * Shows color indicator, label, count, and percentage.
 *
 * @see docs/stories/epic-63/story-63.7-fe-orders-status-breakdown.md
 */

import { cn } from '@/lib/utils'
import {
  getStatusLabel,
  getStatusColor,
  STATUS_ORDER,
  type OrderStatus,
} from '@/lib/orders-status-config'
import type { StatusBreakdownItem } from '@/types/orders-volume'

export interface StatusLegendProps {
  /** Status breakdown items */
  items: StatusBreakdownItem[]
  /** Optional click handler for filtering */
  onStatusClick?: (status: OrderStatus) => void
  /** Layout direction */
  direction?: 'horizontal' | 'vertical'
  /** Additional CSS classes */
  className?: string
}

/**
 * Legend for status breakdown showing color, label, count, percentage
 */
export function StatusLegend({
  items,
  onStatusClick,
  direction = 'vertical',
  className,
}: StatusLegendProps) {
  // Sort items by STATUS_ORDER
  const sortedItems = [...items].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  )

  return (
    <div
      className={cn(
        'flex gap-3',
        direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
        className
      )}
      role="list"
      aria-label="Легенда статусов заказов"
    >
      {sortedItems.map(item => {
        const label = getStatusLabel(item.status)
        const color = getStatusColor(item.status)
        const isClickable = !!onStatusClick

        return (
          <button
            key={item.status}
            type="button"
            role="listitem"
            onClick={() => onStatusClick?.(item.status)}
            disabled={!isClickable}
            className={cn(
              'flex items-center gap-2 text-sm',
              isClickable && 'cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1',
              !isClickable && 'cursor-default'
            )}
            aria-label={`${label}: ${item.count} заказов (${item.percentage.toFixed(1)}%)`}
          >
            {/* Color indicator */}
            <span
              className="h-3 w-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            {/* Label and values */}
            <span className="flex items-center gap-1.5">
              <span className="text-gray-700">{label}:</span>
              <span className="font-medium text-gray-900">
                {item.count.toLocaleString('ru-RU')}
              </span>
              <span className="text-gray-500">({item.percentage.toFixed(1)}%)</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
