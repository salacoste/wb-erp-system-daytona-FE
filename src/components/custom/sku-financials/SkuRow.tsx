'use client'

/**
 * SKU Table Row Component
 * Extracted from SkuFinancialsTable.tsx — single data row with tooltips
 */

import Link from 'next/link'
import { TableRow, TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import type { SkuFinancialItem } from '@/types/sku-financials'
import { getTotalOperatingExpenses } from '@/types/sku-financials'
import { formatCurrency, getValueColorClass } from './sku-table-formatters'
import { ProfitabilityBadge } from './ProfitabilityBadge'
import { VisibilityTooltip } from './VisibilityTooltip'
import { ExpenseBreakdown } from './ExpenseBreakdown'

interface SkuRowProps {
  item: SkuFinancialItem
  showExpenseBreakdown: boolean
  showVisibility: boolean
}

export function SkuRow({ item, showExpenseBreakdown, showVisibility }: SkuRowProps) {
  return (
    <TableRow className={cn('hover:bg-gray-50', item.missingCogs && 'bg-yellow-50/30')}>
      <TableCell className="font-mono text-sm text-gray-500">{item.nmId}</TableCell>
      <TableCell>
        <Link
          href={`${ROUTES.ANALYTICS.PRODUCT}/${item.nmId}`}
          className="group block max-w-[200px]"
        >
          <div className="truncate font-medium group-hover:underline">{item.productName}</div>
          {item.brand && <div className="truncate text-xs text-gray-400">{item.brand}</div>}
        </Link>
      </TableCell>
      <TableCell className="text-right">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium cursor-help">{item.quantity.salesQty} шт.</span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Продано:</span>
                  <span className="font-medium">{item.quantity.salesQty} шт.</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Возвраты:</span>
                  <span className="text-red-400">{item.quantity.returnsQty} шт.</span>
                </div>
                <div className="border-t pt-1 mt-1 flex justify-between gap-4">
                  <span className="text-gray-400">Чистые продажи:</span>
                  <span className="font-medium">
                    {item.quantity.salesQty - item.quantity.returnsQty} шт.
                  </span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(item.revenue.net)}</TableCell>
      <TableCell className="text-right">
        {item.missingCogs ? (
          <span className="text-xs text-gray-400">Не назначена</span>
        ) : (
          <span className="text-gray-700">{formatCurrency(item.costs.cogs)}</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {showExpenseBreakdown ? (
          <ExpenseBreakdown item={item} />
        ) : (
          formatCurrency(getTotalOperatingExpenses(item.costs))
        )}
      </TableCell>
      <TableCell className="text-right">
        {item.missingCogs || item.profit.operating === null ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-gray-400 cursor-help">—</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Нет COGS — прибыль не рассчитана</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className={cn('font-medium', getValueColorClass(item.profit.operating))}>
            {formatCurrency(item.profit.operating)}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <ProfitabilityBadge
          status={item.profitabilityStatus}
          marginPct={item.profit.operatingMarginPct}
        />
      </TableCell>
      {showVisibility && item.visibility && (
        <TableCell>
          <VisibilityTooltip
            commission={item.visibility.commission}
            acquiring={item.visibility.acquiring}
          />
        </TableCell>
      )}
    </TableRow>
  )
}
