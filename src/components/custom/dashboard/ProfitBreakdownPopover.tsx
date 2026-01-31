/**
 * Profit Breakdown Popover Component
 * Story 62.4-FE: Theoretical Profit Card with Breakdown
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Displays breakdown of theoretical profit calculation components.
 *
 * @see docs/stories/epic-62/story-62.4-fe-theoretical-profit-card.md
 */

'use client'

import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TheoreticalProfitBreakdown } from '@/lib/theoretical-profit'

export interface ProfitBreakdownPopoverProps {
  /** Breakdown of all profit components */
  breakdown: TheoreticalProfitBreakdown
  /** Total calculated profit */
  totalProfit: number
}

interface BreakdownRow {
  label: string
  value: number
  sign: '+' | '-'
  color: string
}

/**
 * Displays the theoretical profit formula breakdown
 * Shows each component with appropriate color coding
 */
export function ProfitBreakdownPopover({
  breakdown,
  totalProfit,
}: ProfitBreakdownPopoverProps): React.ReactElement {
  const rows: BreakdownRow[] = [
    { label: 'Заказы', value: breakdown.orders, sign: '+', color: 'text-blue-500' },
    { label: 'COGS', value: breakdown.cogs, sign: '-', color: 'text-gray-500' },
    { label: 'Реклама', value: breakdown.advertising, sign: '-', color: 'text-yellow-600' },
    { label: 'Логистика', value: breakdown.logistics, sign: '-', color: 'text-red-500' },
    { label: 'Хранение', value: breakdown.storage, sign: '-', color: 'text-purple-500' },
  ]

  const isPositive = totalProfit >= 0

  return (
    <div role="region" aria-label="Разбивка теоретической прибыли">
      <h4 className="mb-3 text-sm font-semibold">Разбивка теоретической прибыли</h4>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={row.color}>
              {row.sign}
              {formatCurrency(Math.abs(row.value))}
            </span>
          </div>
        ))}
        <div className="border-t pt-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Теор. прибыль</span>
            <span className={cn(isPositive ? 'text-green-500' : 'text-red-500')}>
              = {formatCurrency(totalProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
