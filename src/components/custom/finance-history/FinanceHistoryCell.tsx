'use client'

/**
 * One value cell in the finance-history grid: the metric value for a week,
 * plus a compact colored WoW delta vs the previous (left) column.
 * Purely presentational — all math lives in finance-history-delta.ts.
 */

import { TableCell } from '@/components/ui/table'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { computeWowDelta, deltaColorClass } from './finance-history-delta'
import type { FinanceHistoryRow } from './finance-history-rows'

interface FinanceHistoryCellProps {
  row: FinanceHistoryRow
  current: number | null
  previous: number | null | undefined
}

function formatValue(row: FinanceHistoryRow, value: number | null): string {
  if (value == null) return '—'
  return row.kind === 'percent' ? formatPercentage(value, 1) : formatCurrency(value)
}

export function FinanceHistoryCell({
  row,
  current,
  previous,
}: FinanceHistoryCellProps): React.ReactElement {
  const delta = computeWowDelta(row.kind, current, previous)
  return (
    <TableCell className="px-3 py-2 text-right align-top">
      <div className="tabular-nums whitespace-nowrap">
        <span className={cn('text-sm', row.emphasis && 'font-semibold')}>
          {formatValue(row, current)}
        </span>
      </div>
      {delta && (
        <div
          className={cn(
            'mt-0.5 text-[11px] leading-tight',
            deltaColorClass(delta.tone, !!row.isNegativeMetric)
          )}
        >
          {delta.text}
        </div>
      )}
    </TableCell>
  )
}
