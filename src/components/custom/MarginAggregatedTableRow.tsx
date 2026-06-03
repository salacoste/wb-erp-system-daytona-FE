'use client'

/**
 * Shared table row for MarginByBrandTable and MarginByCategoryTable
 * Extracted: Epic 74, Story 74.6
 */
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ExternalLink } from 'lucide-react'
import { cn, formatPercentage } from '@/lib/utils'
import { MarginBadge } from './MarginDisplay'
import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import {
  getROIColor,
  formatROI,
  formatProfitPerUnit,
  calculateROI,
  calculateProfitPerUnit,
} from '@/lib/analytics-utils'
import type { MarginAnalyticsAggregated } from '@/types/api'

interface Props {
  item: MarginAnalyticsAggregated
  entityField: 'brand' | 'category'
  entityFallback: string
  onEntityClick?: (value: string) => void
  showROI: boolean
  showProfitPerUnit: boolean
  rowKey: string | number
}

export function MarginAggregatedTableRow({
  item,
  entityField,
  entityFallback,
  onEntityClick,
  showROI,
  showProfitPerUnit,
  rowKey,
}: Props) {
  const entityValue = item[entityField]
  const hasCogs = item.cogs !== undefined
  // PENDING BACKEND (docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md):
  // by-brand/by-category responses omit `missing_cogs_count` even with include_cogs=true
  // (live-verified week 2026-W22), so the "Без COGS" column + yellow row-highlight stay inert
  // (render "—") until the backend delivers it. Guarded count (`|| 0`) keeps this graceful.
  const hasMissingCogs = (item.missing_cogs_count || 0) > 0

  return (
    <TableRow
      key={rowKey}
      className={cn('cursor-pointer hover:bg-gray-50', hasMissingCogs && 'bg-yellow-50/30')}
      onClick={() => onEntityClick && entityValue && onEntityClick(entityValue)}
    >
      <TableCell>
        <div className="font-medium">{entityValue || entityFallback}</div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {(item.total_skus ?? item.qty).toLocaleString('ru-RU')}
      </TableCell>
      <TableCell className="text-right font-medium">{formatCogs(item.revenue_net)}</TableCell>
      <TableCell className="text-right">
        {hasCogs ? (
          <span className="text-gray-700">{formatCogs(item.cogs)}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {hasCogs && item.profit !== undefined ? (
          <span className={cn('font-medium', item.profit >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatCogs(item.profit)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <MarginBadge
          marginPct={item.margin_pct}
          missingDataReason={!hasCogs ? 'COGS_NOT_ASSIGNED' : null}
        />
      </TableCell>
      {showProfitPerUnit && (
        <TableCell className="text-right">
          {hasCogs && item.profit !== undefined ? (
            <span
              className={cn(
                'font-medium',
                (item.profit_per_unit ?? calculateProfitPerUnit(item.profit, item.qty)) !== null &&
                  (item.profit_per_unit ?? calculateProfitPerUnit(item.profit, item.qty))! >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              )}
            >
              {formatProfitPerUnit(
                item.profit_per_unit ?? calculateProfitPerUnit(item.profit, item.qty)
              )}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </TableCell>
      )}
      {showROI && (
        <TableCell className="text-right">
          {hasCogs && item.profit !== undefined ? (
            <span
              className={cn(
                'font-medium',
                getROIColor(item.roi ?? calculateROI(item.profit, item.cogs))
              )}
            >
              {formatROI(item.roi ?? calculateROI(item.profit, item.cogs))}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </TableCell>
      )}
      <TableCell className="text-right">
        {item.operating_profit !== undefined && item.operating_profit !== null ? (
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
                  {item.operating_margin_pct !== null &&
                    item.operating_margin_pct !== undefined && (
                      <p>Опер. маржа: {formatPercentage(item.operating_margin_pct, 2)}</p>
                    )}
                  {(item.skus_with_expenses_only ?? 0) > 0 && (
                    <p className="text-amber-500">{item.skus_with_expenses_only} SKU без продаж</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {hasMissingCogs ? (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
            {item.missing_cogs_count}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell>
        {onEntityClick && entityValue && (
          <button
            onClick={e => {
              e.stopPropagation()
              onEntityClick(entityValue)
            }}
            className="text-blue-600 hover:text-blue-800"
            aria-label={`Открыть детали ${entityValue}`}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </TableCell>
    </TableRow>
  )
}
