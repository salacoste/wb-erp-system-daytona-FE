'use client'

/**
 * Margin analysis table by category with sorting
 * Story 4.6: Margin Analysis by Brand & Category
 * Refactored: Epic 74, Story 74.6 — uses shared aggregated components
 */
import { useState, useMemo } from 'react'
import { Table, TableBody, TableCaption } from '@/components/ui/table'
import type { MarginAnalyticsAggregated } from '@/types/api'
import type { ColumnVisibility } from '@/hooks/useColumnVisibility'
import { ComparisonSummary, PeriodTotals } from './SummaryComparison'
import { MarginAggregatedTableHeader } from './MarginAggregatedTableHeader'
import { MarginAggregatedTableRow } from './MarginAggregatedTableRow'
import {
  type AggregatedSortField,
  type SortOrder,
  compareAggregatedItems,
} from './margin-aggregated-table-sorting'

// Backward-compatible re-exports
export type CategorySortField = AggregatedSortField
export type { SortOrder } from './margin-aggregated-table-sorting'

export interface MarginByCategoryTableProps {
  data: MarginAnalyticsAggregated[]
  onCategoryClick?: (category: string) => void
  /** Story 6.3-FE: Optional column visibility settings */
  columnVisibility?: ColumnVisibility
  /** DEFER-002: Optional comparison period totals for summary row */
  comparisonTotals?: PeriodTotals | null
}

export function MarginByCategoryTable({
  data,
  onCategoryClick,
  columnVisibility,
  comparisonTotals,
}: MarginByCategoryTableProps) {
  const [sortField, setSortField] = useState<AggregatedSortField>('margin_pct')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const showROI = columnVisibility?.roi ?? true
  const showProfitPerUnit = columnVisibility?.profit_per_unit ?? true

  const handleSort = (field: AggregatedSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedData = useMemo(
    () => [...data].sort((a, b) => compareAggregatedItems(a, b, sortField, sortOrder, 'category')),
    [data, sortField, sortOrder]
  )

  // FR-1: totals power the BD/BE contribution-share columns on each row.
  const shareTotals = useMemo(
    () => ({
      revenue: data.reduce((sum, item) => sum + item.revenue_net, 0),
      // BD-5: exclude degenerate rows (cogs=0 ⇒ profit==revenue) from the gross-profit
      // denominator so cogs-assigned rows' profit-share stays honest in mixed weeks.
      grossProfit: data.reduce(
        (sum, item) => sum + ((item.cogs ?? 0) > 0 ? item.profit || 0 : 0),
        0
      ),
    }),
    [data]
  )

  if (!data || data.length === 0) {
    return (
      /* Story 170.5: empty-state tokens — mirrors page.tsx page-level empty branch. */
      <div className="rounded-lg border border-border bg-muted p-12 text-center">
        <p className="text-muted-foreground">Нет данных за выбранную неделю</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      {/* Story 170.5: tabular-nums inherits into shared Header/Row cells (no shared
          font-variant override — verified); scroll region via Table wrapper props. */}
      <Table
        className="sticky-first-column tabular-nums"
        scrollContainerTabIndex={0}
        scrollContainerAriaLabel="Таблица маржинальности по категориям"
      >
        {/* Story 170.5: picker-semantic caption (169.7) — names the analysis without
            verbatim-duplicating the adjacent CardTitle. */}
        <TableCaption>Таблица маржинальности по категориям</TableCaption>
        <MarginAggregatedTableHeader
          entityLabel="Категория"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          showROI={showROI}
          showProfitPerUnit={showProfitPerUnit}
        />
        <TableBody>
          {sortedData.map((item, index) => (
            <MarginAggregatedTableRow
              key={item.category || index}
              rowKey={item.category || index}
              item={item}
              entityField="category"
              entityFallback="(Без категории)"
              onEntityClick={onCategoryClick}
              showROI={showROI}
              showProfitPerUnit={showProfitPerUnit}
              totalRevenue={shareTotals.revenue}
              totalGrossProfit={shareTotals.grossProfit}
              rowCount={data.length}
            />
          ))}
        </TableBody>
      </Table>

      {/* DEFER-002: Summary Footer with optional comparison */}
      {/* Request #65: Use operating_profit (after ALL expenses) instead of profit (gross) */}
      <ComparisonSummary
        current={{
          itemCount: data.length,
          totalRevenue: data.reduce((sum, item) => sum + item.revenue_net, 0),
          totalProfit: data.reduce((sum, item) => sum + (item.operating_profit || 0), 0),
          avgMargin: (() => {
            // Story 70.3-FE (D-9): Weighted average by revenue, not simple arithmetic mean
            const totalRevenue = data.reduce((sum, item) => sum + item.revenue_net, 0)
            const totalProfit = data.reduce((sum, item) => sum + (item.operating_profit || 0), 0)
            return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null
          })(),
        }}
        compare={comparisonTotals}
      />
    </div>
  )
}
