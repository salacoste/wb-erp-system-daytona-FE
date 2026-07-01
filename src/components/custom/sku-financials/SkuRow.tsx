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
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  getValueColorClass,
  sharePercentage,
} from './sku-table-formatters'
import { ProfitabilityBadge } from './ProfitabilityBadge'
import { VisibilityTooltip } from './VisibilityTooltip'
import { ExpenseBreakdown } from './ExpenseBreakdown'
import { ParityMetricCells } from './ParityMetricCells'

interface SkuRowProps {
  item: SkuFinancialItem
  showExpenseBreakdown: boolean
  showVisibility: boolean
  /** Total revenue across the table — denominator for the BD revenue-share column. */
  totalRevenue?: number | null
  /** Total gross profit across the table — denominator for the BE profit-share column. */
  totalGrossProfit?: number | null
}

export function SkuRow({
  item,
  showExpenseBreakdown,
  showVisibility,
  totalRevenue,
  totalGrossProfit,
}: SkuRowProps) {
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
      <TableCell className="hidden lg:table-cell text-right">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="font-medium cursor-help"
                role="button"
                tabIndex={0}
                aria-label={`Подробности продаж: продано ${item.quantity.salesQty} шт.`}
              >
                {item.quantity.salesQty} шт.
              </span>
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
      <TableCell className="hidden lg:table-cell text-right">
        {item.missingCogs ? (
          <span className="text-xs text-gray-400">Не назначена</span>
        ) : (
          <span className="text-gray-700">{formatCurrency(item.costs.cogs)}</span>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-right">
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
                <span
                  className="text-gray-400 cursor-help"
                  role="button"
                  tabIndex={0}
                  aria-label="Информация о прибыли: нет COGS, прибыль не рассчитана"
                >
                  —
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Нет COGS — прибыль не рассчитана</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className={cn('font-medium', getValueColorClass(item.profit.operating))}>
            {formatSignedCurrency(item.profit.operating)}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <ProfitabilityBadge
          status={item.profitabilityStatus}
          marginPct={item.profit.operatingMarginPct}
        />
      </TableCell>
      <TableCell
        className="hidden lg:table-cell text-right text-gray-600"
        title="Вклад в общую выручку"
      >
        {formatPercent(sharePercentage(item.revenue.net, totalRevenue ?? null))}
      </TableCell>
      <TableCell
        className="hidden lg:table-cell text-right text-gray-600"
        title="Вклад в валовую прибыль"
      >
        {formatPercent(sharePercentage(item.profit.gross, totalGrossProfit ?? null))}
      </TableCell>
      <TableCell
        className="hidden lg:table-cell text-right text-gray-600"
        title="Логистика / выручка"
      >
        {formatPercent(sharePercentage(item.costs.logistics, item.revenue.net))}
      </TableCell>
      <ParityMetricCells parity={item.parity} />
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
