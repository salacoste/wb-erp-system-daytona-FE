'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MarginBadge } from './MarginDisplay'
import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import { ArrowUp, ArrowDown, ArrowUpDown, ExternalLink, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarginAnalyticsAggregated } from '@/types/api'
import type { ColumnVisibility } from '@/hooks/useColumnVisibility'
import {
  getROIColor,
  formatROI,
  formatProfitPerUnit,
  calculateROI,
  calculateProfitPerUnit,
} from '@/lib/analytics-utils'
import { ComparisonSummary, PeriodTotals } from './SummaryComparison'

// Story 6.3-FE: Added roi and profit_per_unit sort fields
// Epic 26: Added operating_profit sort field
export type BrandSortField = 'margin_pct' | 'revenue_net' | 'brand' | 'profit' | 'qty' | 'roi' | 'profit_per_unit' | 'operating_profit'
export type SortOrder = 'asc' | 'desc'

export interface MarginByBrandTableProps {
  data: MarginAnalyticsAggregated[]
  onBrandClick?: (brand: string) => void
  /** Story 6.3-FE: Optional column visibility settings */
  columnVisibility?: ColumnVisibility
  /** DEFER-002: Optional comparison period totals for summary row */
  comparisonTotals?: PeriodTotals | null
}

/**
 * Margin analysis table by brand with sorting
 * Story 4.6: Margin Analysis by Brand & Category
 *
 * Features:
 * - Sortable columns (margin, revenue, profit, brand, qty)
 * - Color-coded margin values
 * - Click to drill down to SKU level
 * - Aggregated metrics
 *
 * @example
 * <MarginByBrandTable
 *   data={brandData}
 *   onBrandClick={(brand) => router.push(`/analytics/sku?brand=${brand}`)}
 * />
 */
export function MarginByBrandTable({ data, onBrandClick, columnVisibility, comparisonTotals }: MarginByBrandTableProps) {
  const [sortField, setSortField] = useState<BrandSortField>('margin_pct')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Story 6.3-FE: Default column visibility if not provided
  const showROI = columnVisibility?.roi ?? true
  const showProfitPerUnit = columnVisibility?.profit_per_unit ?? true

  // Handle sort column click
  const handleSort = (field: BrandSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (sortField) {
        case 'margin_pct':
          if (a.margin_pct === undefined || a.margin_pct === null) return 1
          if (b.margin_pct === undefined || b.margin_pct === null) return -1
          aValue = a.margin_pct
          bValue = b.margin_pct
          break
        case 'revenue_net':
          aValue = a.revenue_net
          bValue = b.revenue_net
          break
        case 'profit':
          if (a.profit === undefined || a.profit === null) return 1
          if (b.profit === undefined || b.profit === null) return -1
          aValue = a.profit
          bValue = b.profit
          break
        case 'qty':
          aValue = a.qty
          bValue = b.qty
          break
        case 'brand':
          aValue = (a.brand || '').toLowerCase()
          bValue = (b.brand || '').toLowerCase()
          break
        // Story 6.3-FE: ROI and Profit per Unit sorting
        case 'roi': {
          const aRoi = a.roi ?? calculateROI(a.profit, a.cogs)
          const bRoi = b.roi ?? calculateROI(b.profit, b.cogs)
          if (aRoi === null) return 1
          if (bRoi === null) return -1
          aValue = aRoi
          bValue = bRoi
          break
        }
        case 'profit_per_unit': {
          const aPpu = a.profit_per_unit ?? calculateProfitPerUnit(a.profit, a.qty)
          const bPpu = b.profit_per_unit ?? calculateProfitPerUnit(b.profit, b.qty)
          if (aPpu === null) return 1
          if (bPpu === null) return -1
          aValue = aPpu
          bValue = bPpu
          break
        }
        // Epic 26: Operating Profit sorting
        case 'operating_profit': {
          if (a.operating_profit === undefined || a.operating_profit === null) return 1
          if (b.operating_profit === undefined || b.operating_profit === null) return -1
          aValue = a.operating_profit
          bValue = b.operating_profit
          break
        }
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [data, sortField, sortOrder])

  // Render sort icon
  const renderSortIcon = (field: BrandSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />
    }

    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 text-blue-600" />
    )
  }

  // Empty state
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
        <TableHeader>
          <TableRow>
            <TableHead>
              <button
                onClick={() => handleSort('brand')}
                className="flex items-center font-medium hover:text-blue-600"
              >
                Бренд
                {renderSortIcon('brand')}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort('qty')}
                className="ml-auto flex items-center font-medium hover:text-blue-600"
              >
                Товаров (SKU)
                {renderSortIcon('qty')}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort('revenue_net')}
                className="ml-auto flex items-center font-medium hover:text-blue-600"
              >
                Выручка
                {renderSortIcon('revenue_net')}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end font-medium">
                Себестоимость
              </div>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort('profit')}
                className="ml-auto flex items-center font-medium hover:text-blue-600"
              >
                Прибыль
                {renderSortIcon('profit')}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort('margin_pct')}
                className="ml-auto flex items-center font-medium hover:text-blue-600"
              >
                Маржа %
                {renderSortIcon('margin_pct')}
              </button>
            </TableHead>
            {/* Story 6.3-FE: Profit per Unit column */}
            {showProfitPerUnit && (
              <TableHead className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleSort('profit_per_unit')}
                        className="ml-auto flex items-center font-medium hover:text-blue-600"
                      >
                        Прибыль/ед.
                        <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                        {renderSortIcon('profit_per_unit')}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Прибыль на единицу = Прибыль ÷ Количество</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
            )}
            {/* Story 6.3-FE: ROI column */}
            {showROI && (
              <TableHead className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleSort('roi')}
                        className="ml-auto flex items-center font-medium hover:text-blue-600"
                      >
                        ROI
                        <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                        {renderSortIcon('roi')}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Рентабельность инвестиций = (Прибыль ÷ COGS) × 100%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
            )}
            {/* Epic 26: Operating Profit column */}
            <TableHead className="text-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleSort('operating_profit')}
                      className="ml-auto flex items-center font-medium hover:text-blue-600"
                    >
                      Опер. прибыль
                      <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                      {renderSortIcon('operating_profit')}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Валовая прибыль минус все расходы (логистика, хранение, комиссии)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="w-[100px] text-center">
              <div className="flex items-center justify-center font-medium">
                Без COGS
              </div>
            </TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item, index) => {
            const hasCogs = item.cogs !== undefined
            const hasMissingCogs = (item.missing_cogs_count || 0) > 0

            return (
              <TableRow
                key={item.brand || index}
                className={cn(
                  'cursor-pointer hover:bg-gray-50',
                  hasMissingCogs && 'bg-yellow-50/30'
                )}
                onClick={() => onBrandClick && item.brand && onBrandClick(item.brand)}
              >
                <TableCell>
                  <div className="font-medium">{item.brand || '(Без бренда)'}</div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.qty.toLocaleString('ru-RU')}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCogs(item.revenue_net)}
                </TableCell>
                <TableCell className="text-right">
                  {hasCogs ? (
                    <span className="text-gray-700">{formatCogs(item.cogs)}</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {hasCogs && item.profit !== undefined ? (
                    <span
                      className={cn(
                        'font-medium',
                        item.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
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
                {/* Story 6.3-FE: Profit per Unit cell */}
                {showProfitPerUnit && (
                  <TableCell className="text-right">
                    {hasCogs && item.profit !== undefined ? (
                      <span className={cn(
                        'font-medium',
                        (item.profit_per_unit ?? calculateProfitPerUnit(item.profit, item.qty)) !== null &&
                        (item.profit_per_unit ?? calculateProfitPerUnit(item.profit, item.qty))! >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}>
                        {formatProfitPerUnit(
                          item.profit_per_unit ?? calculateProfitPerUnit(item.profit, item.qty)
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                )}
                {/* Story 6.3-FE: ROI cell */}
                {showROI && (
                  <TableCell className="text-right">
                    {hasCogs && item.profit !== undefined ? (
                      <span className={cn(
                        'font-medium',
                        getROIColor(item.roi ?? calculateROI(item.profit, item.cogs))
                      )}>
                        {formatROI(item.roi ?? calculateROI(item.profit, item.cogs))}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                )}
                {/* Epic 26: Operating Profit cell */}
                <TableCell className="text-right">
                  {item.operating_profit !== undefined && item.operating_profit !== null ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            'font-medium cursor-help',
                            item.operating_profit < 0 ? 'text-red-600' : 'text-green-600',
                            (item.skus_with_expenses_only ?? 0) > 0 && 'underline decoration-dotted'
                          )}>
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
                              <p>Опер. маржа: {item.operating_margin_pct.toFixed(2)}%</p>
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
                  {onBrandClick && item.brand && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onBrandClick(item.brand!)
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Открыть детали бренда ${item.brand}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
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
            const withMargin = data.filter(
              (item) => item.margin_pct !== undefined && item.margin_pct !== null
            )
            if (withMargin.length === 0) return null
            return withMargin.reduce((sum, item) => sum + (item.margin_pct || 0), 0) / withMargin.length
          })(),
        }}
        compare={comparisonTotals}
      />
    </div>
  )
}
