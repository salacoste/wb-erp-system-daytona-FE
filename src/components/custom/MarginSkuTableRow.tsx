'use client'

/**
 * MarginBySkuTable row component
 * Extracted from MarginBySkuTable.tsx (Epic 74, Story 74.6)
 */
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarginBadge } from './MarginDisplay'
import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import { getROIColor, formatROI, formatProfitPerUnit } from '@/lib/analytics-utils'
import { getSkuProfit } from './margin-sku-table-sorting'
import type { MarginAnalyticsSku } from '@/types/api'

interface Props {
  item: MarginAnalyticsSku
  onProductClick?: (nmId: string) => void
  showROI: boolean
  showProfitPerUnit: boolean
}

export function MarginSkuTableRow({ item, onProductClick, showROI, showProfitPerUnit }: Props) {
  const hasCogs = !item.missing_cogs_flag && item.cogs !== undefined
  const profit = getSkuProfit(item)
  const margin =
    profit !== null && item.revenue_net !== 0 ? (profit / Math.abs(item.revenue_net)) * 100 : null
  const profitPerUnit = profit !== null && item.qty > 0 ? profit / item.qty : null
  const roi = profit !== null && item.cogs && item.cogs > 0 ? (profit / item.cogs) * 100 : null

  return (
    <TableRow
      className={cn('cursor-pointer hover:bg-gray-50', item.missing_cogs_flag && 'bg-yellow-50/30')}
      onClick={() => onProductClick && onProductClick(item.nm_id)}
    >
      <TableCell className="font-mono text-sm">{item.nm_id}</TableCell>
      <TableCell>
        <div className="max-w-md">
          {item.weeks_with_sales !== undefined || item.weeks_with_cogs !== undefined ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate font-medium cursor-help">
                    {item.sa_name}
                    <span className="ml-1 text-xs text-gray-400">
                      ({item.weeks_with_sales ?? 0}н)
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p>Недель с продажами: {item.weeks_with_sales ?? 0}</p>
                    <p>Недель с COGS: {item.weeks_with_cogs ?? 0}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="truncate font-medium">{item.sa_name}</div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">{item.qty.toLocaleString('ru-RU')}</TableCell>
      <TableCell className="text-right font-medium">{formatCogs(item.revenue_net)}</TableCell>
      <TableCell className="text-right">
        {hasCogs ? (
          <span className="text-gray-700">{formatCogs(item.cogs)}</span>
        ) : (
          <span className="text-xs text-gray-400">
            {item.missing_cogs_flag ? 'Не назначена' : '—'}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {profit !== null ? (
          <span className={cn('font-medium', profit >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatCogs(profit)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <MarginBadge
          marginPct={margin}
          missingDataReason={item.missing_cogs_flag ? 'COGS_NOT_ASSIGNED' : null}
        />
      </TableCell>
      {showProfitPerUnit && (
        <TableCell className="text-right">
          {profitPerUnit !== null ? (
            <span
              className={cn('font-medium', profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600')}
            >
              {formatProfitPerUnit(profitPerUnit)}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </TableCell>
      )}
      {showROI && (
        <TableCell className="text-right">
          {roi !== null ? (
            <span className={cn('font-medium', getROIColor(roi))}>{formatROI(roi)}</span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </TableCell>
      )}
      <TableCell>
        {onProductClick && (
          <button
            onClick={e => {
              e.stopPropagation()
              onProductClick(item.nm_id)
            }}
            className="text-blue-600 hover:text-blue-800"
            aria-label={`Открыть детали товара ${item.nm_id}`}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </TableCell>
    </TableRow>
  )
}
