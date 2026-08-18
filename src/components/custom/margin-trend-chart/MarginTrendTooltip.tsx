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
      <div className="rounded-lg border bg-popover p-3 shadow-md">
        {/* Week header */}
        <p className="font-semibold text-foreground mb-2">{dataPoint.week}</p>
        <p className="text-xs text-muted-foreground mb-2">
          {formatDateRange(dataPoint.week_start_date, dataPoint.week_end_date)}
        </p>

        {/* Margin percentage */}
        {dataPoint.margin_pct !== null && dataPoint.margin_pct !== undefined ? (
          <p className="text-sm mb-1">
            <span className="text-muted-foreground">Маржа:</span>{' '}
            <span
              className={`font-medium ${
                dataPoint.margin_pct > 0
                  ? 'text-financial-positive'
                  : dataPoint.margin_pct < 0
                    ? 'text-financial-negative'
                    : 'text-muted-foreground'
              }`}
            >
              {formatMarginPercent(dataPoint.margin_pct)}
            </span>
          </p>
        ) : (
          <p className="text-sm mb-1 text-muted-foreground">Маржа: нет данных</p>
        )}

        {/* Revenue */}
        <p className="text-sm mb-1">
          <span className="text-muted-foreground">Выручка:</span>{' '}
          <span className="font-medium">{formatCurrency(dataPoint.revenue_net)}</span>
        </p>

        {/* Profit */}
        {dataPoint.profit !== null && dataPoint.profit !== undefined ? (
          <p className="text-sm mb-1">
            <span className="text-muted-foreground">Прибыль:</span>{' '}
            <span className="font-medium">{formatCurrency(dataPoint.profit)}</span>
          </p>
        ) : null}

        {/* Units sold */}
        <p className="text-sm mb-1">
          <span className="text-muted-foreground">Продано:</span>{' '}
          <span className="font-medium">{dataPoint.qty} шт.</span>
        </p>

        {/* Missing COGS warning */}
        {dataPoint.missing_cogs_count > 0 && (
          <p className="text-xs text-status-warning mt-2">
            ⚠️ Нет COGS для {dataPoint.missing_cogs_count} из {dataPoint.sku_count} SKU
          </p>
        )}
      </div>
    )
  }
  return null
}
