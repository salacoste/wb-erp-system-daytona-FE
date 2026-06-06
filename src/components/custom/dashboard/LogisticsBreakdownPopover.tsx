/**
 * LogisticsBreakdownPopover -- Story 65.6
 * Badge + Popover showing 4 logistics subcategories on LogisticsMetricCard.
 *
 * Rows:
 * 1. К клиенту при продаже (to_buyer) -- green (delivery to customer)
 * 2. К клиенту при отмене (to_buyer_cancel) -- red
 * 3. От клиента при отмене (from_buyer_cancel) -- red
 * 4. От клиента при возврате (from_buyer_return) -- red
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md Story 65.6
 */

'use client'

import type { LogisticsBreakdown } from '@/types/finance-summary'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatCurrency } from '@/lib/utils'

// story-65.6: logistics breakdown
export interface LogisticsBreakdownPopoverProps {
  breakdown: LogisticsBreakdown | null | undefined
  /** Sale gross revenue for % calculation */
  saleGross: number | null | undefined
}

/** Format percentage with Russian decimal comma, 1 decimal place */
function fmtPct(value: number, total: number): string {
  if (total === 0) return '0,0 %'
  const pct = (Math.abs(value) / Math.abs(total)) * 100
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(pct) + ' %'
  )
}

interface RowDef {
  label: string
  value: number | null
  colorClass: string
  testId: string
}

const ROWS: RowDef[] = [
  {
    label: 'К клиенту при продаже',
    value: null,
    colorClass: 'text-green-600 bg-green-50',
    testId: 'row-to-buyer',
  },
  {
    label: 'К клиенту при отмене',
    value: null,
    colorClass: 'text-red-600 bg-red-50',
    testId: 'row-to-buyer-cancel',
  },
  {
    label: 'От клиента при отмене',
    value: null,
    colorClass: 'text-red-600 bg-red-50',
    testId: 'row-from-buyer-cancel',
  },
  {
    label: 'От клиента при возврате',
    value: null,
    colorClass: 'text-red-600 bg-red-50',
    testId: 'row-from-buyer-return',
  },
]

/** Sum non-null breakdown values; returns 0 if all null */
function sumBreakdown(b: LogisticsBreakdown): number {
  return (
    (b.to_buyer ?? 0) +
    (b.to_buyer_cancel ?? 0) +
    (b.from_buyer_cancel ?? 0) +
    (b.from_buyer_return ?? 0)
  )
}

export function LogisticsBreakdownPopover(
  props: LogisticsBreakdownPopoverProps
): React.ReactElement {
  const { breakdown, saleGross } = props

  const values = breakdown
    ? [
        breakdown.to_buyer,
        breakdown.to_buyer_cancel,
        breakdown.from_buyer_cancel,
        breakdown.from_buyer_return,
      ]
    : [null, null, null, null]

  const hasAny = values.some(v => v != null)
  const rowCount = hasAny ? values.filter(v => v != null).length : 4
  const revenue = saleGross ?? 0
  const total = breakdown ? sumBreakdown(breakdown) : 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-testid="logistics-breakdown-badge"
          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium cursor-pointer hover:bg-muted/80"
          aria-label={`Показать ${rowCount} категории логистики`}
        >
          {rowCount}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" role="dialog">
        <p className="mb-2 text-sm font-semibold text-foreground">Разбивка логистики</p>
        <div className="space-y-1.5">
          {ROWS.map((row, i) => {
            const val = values[i]
            if (val == null) return null
            return (
              <div
                key={row.testId}
                data-testid={row.testId}
                className={`flex items-center justify-between rounded px-2 py-1 text-sm ${row.colorClass}`}
              >
                <span>{row.label}</span>
                <span className="flex items-center gap-2 font-medium">
                  <span>{formatCurrency(val)}</span>
                  <span className="text-xs opacity-70">{fmtPct(val, revenue)}</span>
                </span>
              </div>
            )
          })}
        </div>
        {hasAny && (
          <div className="mt-1 flex items-center justify-between border-t pt-2 text-sm font-semibold">
            <span>Итого</span>
            <span className="text-red-600">{formatCurrency(total)}</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
