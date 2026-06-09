'use client'

/**
 * Extracted cell renderers for MarginAggregatedTableRow
 * Split for file-size compliance.
 */

import { TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatPercentage } from '@/lib/utils'
import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import type { MarginAnalyticsAggregated } from '@/types/api'

/**
 * Operating profit cell with tooltip showing expense breakdown
 */
export function OperatingProfitCell({ item }: { item: MarginAnalyticsAggregated }) {
  if (item.operating_profit === undefined || item.operating_profit === null) {
    return (
      <TableCell className="text-right">
        <span className="text-xs text-gray-400">—</span>
      </TableCell>
    )
  }

  return (
    <TableCell className="text-right">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'font-medium cursor-help',
                item.operating_profit < 0 ? 'text-red-600' : 'text-green-600',
                (item.skus_with_expenses_only ?? 0) > 0 && 'underline decoration-dotted'
              )}
            >
              {formatCogs(item.operating_profit)}
              {(item.skus_with_expenses_only ?? 0) > 0 && (
                <span className="ml-1 text-xs">💤{item.skus_with_expenses_only}</span>
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              {item.total_expenses !== undefined && (
                <p>Расходы: {formatCogs(item.total_expenses)}</p>
              )}
              {item.operating_margin_pct !== null && item.operating_margin_pct !== undefined && (
                <p>Опер. маржа: {formatPercentage(item.operating_margin_pct, 2)}</p>
              )}
              {(item.skus_with_expenses_only ?? 0) > 0 && (
                <p className="text-amber-500">{item.skus_with_expenses_only} SKU без продаж</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  )
}

/**
 * Missing COGS count badge cell
 */
export function MissingCogsCell({ item }: { item: MarginAnalyticsAggregated }) {
  const hasMissingCogs = (item.missing_cogs_count || 0) > 0

  return (
    <TableCell className="text-center">
      {hasMissingCogs ? (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
          {item.missing_cogs_count}
        </span>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      )}
    </TableCell>
  )
}
