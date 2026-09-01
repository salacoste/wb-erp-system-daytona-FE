'use client'

/**
 * Shared table row for MarginByBrandTable and MarginByCategoryTable
 * Extracted: Epic 74, Story 74.6
 */
import { TableCell, TableRow } from '@/components/ui/table'
import { ExternalLink } from 'lucide-react'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { MarginBadge } from './MarginDisplay'
import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import {
  getROIColor,
  formatROI,
  formatProfitPerUnit,
  calculateROI,
  calculateProfitPerUnit,
  sharePercentage,
  sharePercentageGate,
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
  /** Total revenue across the table — denominator for the BD revenue-share column. */
  totalRevenue?: number | null
  /** Total gross profit across the table — denominator for the BE profit-share column. */
  totalGrossProfit?: number | null
  /** Rows in the table — shares render «—» when <2 (a single row is trivially 100 %). */
  rowCount?: number | null
}

export function MarginAggregatedTableRow({
  item,
  entityField,
  entityFallback,
  onEntityClick,
  showROI,
  showProfitPerUnit,
  rowKey,
  totalRevenue,
  totalGrossProfit,
  rowCount,
}: Props) {
  const entityValue = item[entityField]
  // BD-5: cogs === 0 means COGS unassigned for the period (by-brand: cogs:0,
  // by-category: cogs_rub:"0"). Then profit collapses to revenue, margin_pct → 100 %,
  // ROI / profit-per-unit are meaningless. Gate on cogs > 0 → render «—». Mirrors the
  // period-card fix 0436ecc9 + the cogs===0→null convention in roi-profit-utils.ts:93.
  const hasCogs = (item.cogs ?? 0) > 0
  // Backend now returns missing_cogs_count for by-brand/by-category when include_cogs=true.
  // Defensive guard (|| 0) preserved for cached/stale responses.
  const hasMissingCogs = (item.missing_cogs_count || 0) > 0
  // FR-1 contribution shares (null → "—", never a misleading 0 %). BD-5 review R1:
  // gate when <2 rows — a single row is trivially 100 % of the total («Вклад 100 %»).
  const revenueShare = sharePercentageGate(
    sharePercentage(item.revenue_net, totalRevenue),
    rowCount
  )
  // BD-5: profit-share derives from gross profit — degenerate when cogs=0 (profit == revenue).
  const profitShare = sharePercentageGate(
    sharePercentage(hasCogs ? item.profit : null, totalGrossProfit),
    rowCount
  )

  return (
    <TableRow
      key={rowKey}
      className={cn('cursor-pointer hover:bg-muted/50', hasMissingCogs && 'bg-status-warning/10')}
      onClick={() => onEntityClick && entityValue && onEntityClick(entityValue)}
    >
      <TableCell>
        <div className="font-medium">{entityValue || entityFallback}</div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {/* BD-20: "Товаров (SKU)" is a SKU count — fall back to "—" when missing, NOT to
            item.qty (total units sold), which would mislabel units as SKU count. */}
        {item.total_skus != null ? item.total_skus.toLocaleString('ru-RU') : '—'}
      </TableCell>
      <TableCell className="text-right font-medium">{formatCogs(item.revenue_net)}</TableCell>
      <TableCell className="text-right">
        {hasCogs ? (
          <span className="text-foreground">{formatCogs(item.cogs)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {hasCogs && item.profit !== undefined ? (
          <span className="font-medium text-foreground">
            {item.profit > 0 ? '+' : ''}
            {formatCogs(item.profit)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <MarginBadge
          marginPct={hasCogs ? item.margin_pct : null}
          missingDataReason={!hasCogs ? 'COGS_NOT_ASSIGNED' : null}
        />
      </TableCell>
      <TableCell className="text-right text-muted-foreground" title="Вклад в общую выручку">
        {revenueShare === null ? '—' : formatPercentage(revenueShare, 1)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground" title="Вклад в валовую прибыль">
        {profitShare === null ? '—' : formatPercentage(profitShare, 1)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground" title="Расходы на рекламу">
        {item.advertising_cost == null ? '—' : formatCurrency(item.advertising_cost)}
      </TableCell>
      <TableCell
        className="text-right text-muted-foreground"
        title="Доля рекламных расходов в выручке (ДРР)"
      >
        {item.drr_pct == null ? '—' : formatPercentage(item.drr_pct, 1)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground" title="Чистая прибыль после налога">
        {item.net_profit_after_tax == null ? '—' : formatCurrency(item.net_profit_after_tax)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground" title="Сумма продаж без скидок (СПП)">
        {item.spp_rub == null ? '—' : formatCurrency(item.spp_rub)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground" title="Количество отмен">
        {item.cancellations_qty ?? '—'}
      </TableCell>
      <TableCell
        className="text-right text-muted-foreground"
        title="Стоимость остатков по закупочной цене"
      >
        {item.stock_value_rub == null ? '—' : formatCurrency(item.stock_value_rub)}
      </TableCell>
      {/* Not rowCount-gated (unlike revenueShare/profitShare): a per-entity liquidity ratio
          (stock ÷ working capital), not a contribution-to-table-total share — 100 % for one
          row is meaningful, not degenerate. */}
      <TableCell
        className="text-right text-muted-foreground"
        title="Доля стоимости остатков в оборотном капитале"
      >
        {item.stock_value_share_pct == null ? '—' : formatPercentage(item.stock_value_share_pct, 1)}
      </TableCell>
      {showProfitPerUnit && (
        <TableCell className="text-right">
          {hasCogs && item.profit !== undefined ? (
            <span className="font-medium text-foreground">
              {formatProfitPerUnit(
                item.profit_per_unit ?? calculateProfitPerUnit(item.profit, item.qty)
              )}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
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
            <span className="text-xs text-muted-foreground">—</span>
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
            className="text-primary hover:text-primary/80"
            aria-label={`Открыть детали ${entityValue}`}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </TableCell>
    </TableRow>
  )
}
