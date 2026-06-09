'use client'

/**
 * Pattern Tooltip Component
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Custom tooltip for seasonal pattern charts.
 * Displays localized month/day names with order counts.
 *
 * @see docs/stories/epic-63/story-63.8-fe-orders-seasonal-patterns.md
 */

import { localizeMonth, localizeWeekday, formatPeakHour } from '@/lib/seasonal-localization'
import { formatCurrency } from '@/lib/utils'

interface MonthlyPayload {
  month: string
  avgOrders: number
  avgRevenue?: number
}

interface WeekdayPayload {
  dayOfWeek: string
  avgOrders: number
  peakHour?: number
}

interface TooltipPayloadItem {
  payload: MonthlyPayload | WeekdayPayload
}

interface PatternTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  type: 'monthly' | 'weekday'
}

/**
 * Custom tooltip for seasonal pattern charts
 * Shows localized names and formatted values
 */
export function PatternTooltip({ active, payload, type }: PatternTooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  if (type === 'monthly') {
    const monthData = data as MonthlyPayload
    const localizedMonth = localizeMonth(monthData.month)

    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <p className="font-medium text-gray-900">{localizedMonth}</p>
        <p className="mt-1 text-sm text-gray-600">
          <span className="font-semibold">{monthData.avgOrders.toLocaleString('ru-RU')}</span>{' '}
          заказов (среднее)
        </p>
        {monthData.avgRevenue != null && (
          <p className="text-sm text-gray-500">{formatCurrency(monthData.avgRevenue)}</p>
        )}
      </div>
    )
  }

  // Weekday type
  const weekdayData = data as WeekdayPayload
  const localizedDay = localizeWeekday(weekdayData.dayOfWeek)

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="font-medium text-gray-900">{localizedDay}</p>
      <p className="mt-1 text-sm text-gray-600">
        <span className="font-semibold">{weekdayData.avgOrders.toLocaleString('ru-RU')}</span>{' '}
        заказов (среднее)
      </p>
      {weekdayData.peakHour != null && (
        <p className="text-sm text-gray-500">Пик: {formatPeakHour(weekdayData.peakHour)}</p>
      )}
    </div>
  )
}
