'use client'

/**
 * Status Tooltip Component
 * Story 63.7-FE: Orders Status Breakdown Chart
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Custom tooltip for status breakdown charts (bar and pie).
 * Displays status name, count, and percentage in Russian.
 *
 * @see docs/stories/epic-63/story-63.7-fe-orders-status-breakdown.md
 */

import { getStatusLabel, type OrderStatus } from '@/lib/orders-status-config'

interface StatusPayload {
  status: OrderStatus
  count: number
  percentage: number
  fill?: string
}

interface TooltipPayloadItem {
  payload: StatusPayload
}

interface StatusTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

/**
 * Custom tooltip for status breakdown charts
 * Shows status label, count, and percentage
 */
export function StatusTooltip({ active, payload }: StatusTooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  const label = getStatusLabel(data.status)
  const formattedCount = data.count.toLocaleString('ru-RU')
  const formattedPercent = data.percentage.toFixed(1)

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="mt-1 text-sm text-gray-600">
        <span className="font-semibold">{formattedCount}</span> заказов
      </p>
      <p className="text-sm text-gray-500">{formattedPercent}%</p>
    </div>
  )
}
