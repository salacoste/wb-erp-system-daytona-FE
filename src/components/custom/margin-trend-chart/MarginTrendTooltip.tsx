'use client'

import { formatCurrency } from '@/lib/utils'
import { formatMarginPercent } from '@/components/custom/MarginDisplay'
import { formatDateRange } from './margin-trend-utils'
import type { MarginTrendPoint } from '@/types/api'

interface MarginTrendTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
    color: string
    payload: MarginTrendPoint
  }>
}

/**
 * Custom tooltip component showing detailed margin metrics
 * Displays: week, margin %, revenue, profit, units sold
 */
export function MarginTrendTooltip({ active, payload }: MarginTrendTooltipProps) {
  if (active && payload && payload.length > 0) {
    const dataPoint = payload[0].payload

    return (
      <div className="rounded-lg border bg-white p-3 shadow-md">
        {/* Week header */}
        <p className="font-semibold text-gray-900 mb-2">{dataPoint.week}</p>
        <p className="text-xs text-gray-500 mb-2">
          {formatDateRange(dataPoint.week_start_date, dataPoint.week_end_date)}
        </p>

        {/* Margin percentage */}
        {dataPoint.margin_pct !== null && dataPoint.margin_pct !== undefined ? (
          <p className="text-sm mb-1">
            <span className="text-gray-600">Маржа:</span>{' '}
            <span
              className={`font-medium ${
                dataPoint.margin_pct > 0
                  ? 'text-green-600'
                  : dataPoint.margin_pct < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {formatMarginPercent(dataPoint.margin_pct)}
            </span>
          </p>
        ) : (
          <p className="text-sm mb-1 text-gray-500">Маржа: нет данных</p>
        )}

        {/* Revenue */}
        <p className="text-sm mb-1">
          <span className="text-gray-600">Выручка:</span>{' '}
          <span className="font-medium">{formatCurrency(dataPoint.revenue_net)}</span>
        </p>

        {/* Profit */}
        {dataPoint.profit !== null && dataPoint.profit !== undefined ? (
          <p className="text-sm mb-1">
            <span className="text-gray-600">Прибыль:</span>{' '}
            <span className="font-medium">{formatCurrency(dataPoint.profit)}</span>
          </p>
        ) : null}

        {/* Units sold */}
        <p className="text-sm mb-1">
          <span className="text-gray-600">Продано:</span>{' '}
          <span className="font-medium">{dataPoint.qty} шт.</span>
        </p>

        {/* Missing COGS warning */}
        {dataPoint.missing_cogs_count > 0 && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ Нет COGS для {dataPoint.missing_cogs_count} из {dataPoint.sku_count} SKU
          </p>
        )}
      </div>
    )
  }
  return null
}
