'use client'

/**
 * Shared table row for MarginByBrandTable and MarginByCategoryTable
 * Extracted: Epic 74, Story 74.6
 */
import { TableCell, TableRow } from '@/components/ui/table'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarginBadge } from './MarginDisplay'
import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import {
  getROIColor,
  formatROI,
  formatProfitPerUnit,
  calculateROI,
  calculateProfitPerUnit,
} from '@/lib/analytics-utils'
import { OperatingProfitCell, MissingCogsCell } from './MarginRowCells'
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
  // Backend now returns missing_cogs_count for by-brand/by-category when include_cogs=true.
  // Defensive guard (|| 0) preserved for cached/stale responses.
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
      <OperatingProfitCell item={item} />
      <MissingCogsCell item={item} />
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
