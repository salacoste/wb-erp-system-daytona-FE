'use client'

/**
 * Margin analysis table by SKU with sorting
 * Story 4.5: Margin Analysis by SKU
 * Story 6.3-FE: ROI & Profit per Unit columns
 * Refactored: Epic 74, Story 74.6 — extracted header, row, sorting
 */
import { useState, useMemo } from 'react'
import { Table, TableBody } from '@/components/ui/table'
import type { MarginAnalyticsSku } from '@/types/api'
import type { ColumnVisibility } from '@/hooks/useColumnVisibility'
import { ComparisonSummary, PeriodTotals } from './SummaryComparison'
import { MarginSkuTableHeader } from './MarginSkuTableHeader'
import { MarginSkuTableRow } from './MarginSkuTableRow'
import {
  type SortField,
  type SortOrder,
  getSkuProfit,
  compareSkuItems,
} from './margin-sku-table-sorting'

// Backward-compatible re-exports
export type { SortField, SortOrder } from './margin-sku-table-sorting'

export interface MarginBySkuTableProps {
  data: MarginAnalyticsSku[]
  onProductClick?: (nmId: string) => void
  /** Story 6.3-FE: Optional column visibility settings */
  columnVisibility?: ColumnVisibility
  /** DEFER-002: Optional comparison period totals for summary row */
  comparisonTotals?: PeriodTotals | null
}

export function MarginBySkuTable({
  data,
  onProductClick,
  columnVisibility,
  comparisonTotals,
}: MarginBySkuTableProps) {
  const [sortField, setSortField] = useState<SortField>('margin_pct')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const showROI = columnVisibility?.roi ?? true
  const showProfitPerUnit = columnVisibility?.profit_per_unit ?? true

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedData = useMemo(
    () => [...data].sort((a, b) => compareSkuItems(a, b, sortField, sortOrder)),
    [data, sortField, sortOrder]
  )

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
        <p className="text-gray-600">Нет данных за выбранную неделю</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <MarginSkuTableHeader
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          showROI={showROI}
          showProfitPerUnit={showProfitPerUnit}
        />
        <TableBody>
          {sortedData.map(item => (
            <MarginSkuTableRow
              key={item.nm_id}
              item={item}
              onProductClick={onProductClick}
              showROI={showROI}
              showProfitPerUnit={showProfitPerUnit}
            />
          ))}
        </TableBody>
      </Table>

      {/* DEFER-002: Summary Footer with optional comparison */}
      <ComparisonSummary
        current={{
          itemCount: data.length,
          totalRevenue: data.reduce((sum, item) => sum + item.revenue_net, 0),
          totalProfit: data.reduce((sum, item) => sum + (getSkuProfit(item) || 0), 0),
          avgMargin: (() => {
            const withProfit = data.filter(item => getSkuProfit(item) !== null)
            if (withProfit.length === 0) return null
            const tp = withProfit.reduce((sum, item) => sum + (getSkuProfit(item) || 0), 0)
            const tr = withProfit.reduce((sum, item) => sum + item.revenue_net, 0)
            return tr !== 0 ? (tp / Math.abs(tr)) * 100 : null
          })(),
        }}
        compare={comparisonTotals}
      />
    </div>
  )
}
