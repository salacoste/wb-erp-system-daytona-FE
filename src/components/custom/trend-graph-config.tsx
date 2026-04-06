/**
 * TrendGraph configuration — labels, tooltip, constants
 * Extracted from TrendGraph.tsx for file size compliance
 */

'use client'

import { formatCurrency } from '@/lib/utils'
import type { TrendDataPoint } from '@/hooks/useTrends'

export const METRIC_CHANGE_KEY = 'trends-metric-change-dismissed'

export const METRIC_LABELS: Record<string, string> = {
  revenue: 'Выручка продавца',
  totalPayable: 'К перечислению',
  payoutTotal: 'Перечислено',
  cogsTotal: 'Себестоимость',
  operatingProfit: 'Опер. прибыль',
  logisticsCost: 'Логистика',
  efficiencyPct: 'Эффективность, %',
}

const PCT_METRICS = new Set(['efficiencyPct'])

export function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string; payload: TrendDataPoint }>
}) {
  if (!active || !payload?.length) return null
  const dataPoint = payload[0].payload
  return (
    <div className="rounded-lg border bg-white p-3 shadow-md">
      <p className="font-semibold text-gray-900 mb-2">{dataPoint.week}</p>
      {payload.map(entry => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {METRIC_LABELS[entry.dataKey] ?? entry.dataKey}:{' '}
          <span className="font-medium">
            {PCT_METRICS.has(entry.dataKey) ? `${entry.value}%` : formatCurrency(entry.value)}
          </span>
        </p>
      ))}
    </div>
  )
}
