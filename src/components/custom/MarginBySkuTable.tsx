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
import type { MarginAnalyticsSku } from '@/types/api'
import type { ColumnVisibility } from '@/hooks/useColumnVisibility'
import {
  getROIColor,
  formatROI,
  formatProfitPerUnit,
} from '@/lib/analytics-utils'
import { ComparisonSummary, PeriodTotals } from './SummaryComparison'

// Story 6.3-FE: Added roi and profit_per_unit sort fields
export type SortField = 'margin_pct' | 'revenue_net' | 'sa_name' | 'profit' | 'qty' | 'roi' | 'profit_per_unit'
export type SortOrder = 'asc' | 'desc'

export interface MarginBySkuTableProps {
  data: MarginAnalyticsSku[]
  onProductClick?: (nmId: string) => void
  /** Story 6.3-FE: Optional column visibility settings */
  columnVisibility?: ColumnVisibility
  /** DEFER-002: Optional comparison period totals for summary row */
  comparisonTotals?: PeriodTotals | null
}

/**
 * Margin analysis table by SKU with sorting
 * Story 4.5: Margin Analysis by SKU
 * Story 6.3-FE: ROI & Profit per Unit columns
 *
 * Features:
 * - Sortable columns (margin, revenue, profit, name, qty, roi, profit_per_unit)
 * - Color-coded margin and ROI values
 * - Optional columns (ROI, Profit/Unit) with visibility toggle
 * - Click to navigate to product detail
 * - Loading skeleton
 * - Empty state
 *
 * @example
 * <MarginBySkuTable
 *   data={marginData}
 *   onProductClick={(nmId) => router.push(`/products/${nmId}`)}
 *   columnVisibility={{ roi: true, profit_per_unit: true, markup_percent: false }}
 * />
 */
export function MarginBySkuTable({ data, onProductClick, columnVisibility, comparisonTotals }: MarginBySkuTableProps) {
  const [sortField, setSortField] = useState<SortField>('margin_pct')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Story 6.3-FE: Default column visibility if not provided
  const showROI = columnVisibility?.roi ?? true
  const showProfitPerUnit = columnVisibility?.profit_per_unit ?? true

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to descending
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Helper: Get operating profit from API (includes all expenses)
  // operating_profit = gross_profit - total_expenses (logistics, storage, commission, acquiring, etc.)
  // See: docs/request-backend/63-operating-profit-formula-clarification.md
  const getProfit = (item: MarginAnalyticsSku): number | null => {
    if (item.missing_cogs_flag || item.cogs === undefined) return null
    // Use API's operating_profit which includes full expense formula
    if (item.operating_profit !== undefined && item.operating_profit !== null) {
      return item.operating_profit
    }
    return null
  }

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (sortField) {
        case 'margin_pct': {
          // Calculate margin using API's operating_profit_rub
          const aProfit = getProfit(a)
          const bProfit = getProfit(b)
          const aMargin = aProfit !== null && a.revenue_net !== 0 ? (aProfit / Math.abs(a.revenue_net)) * 100 : null
          const bMargin = bProfit !== null && b.revenue_net !== 0 ? (bProfit / Math.abs(b.revenue_net)) * 100 : null
          if (aMargin === null) return 1
          if (bMargin === null) return -1
          aValue = aMargin
          bValue = bMargin
          break
        }
        case 'revenue_net':
          aValue = a.revenue_net
          bValue = b.revenue_net
          break
        case 'profit': {
          // Sort by operating_profit_rub from API (full expense formula)
          const aProfit = getProfit(a)
          const bProfit = getProfit(b)
          if (aProfit === null) return 1
          if (bProfit === null) return -1
          aValue = aProfit
          bValue = bProfit
          break
        }
        case 'qty':
          aValue = a.qty
          bValue = b.qty
          break
        case 'sa_name':
          aValue = a.sa_name.toLowerCase()
          bValue = b.sa_name.toLowerCase()
          break
        // Story 6.3-FE: ROI sorting using API profit
        case 'roi': {
          const aProfit = getProfit(a)
          const bProfit = getProfit(b)
          const aRoi = aProfit !== null && a.cogs && a.cogs > 0 ? (aProfit / a.cogs) * 100 : null
          const bRoi = bProfit !== null && b.cogs && b.cogs > 0 ? (bProfit / b.cogs) * 100 : null
          if (aRoi === null) return 1
          if (bRoi === null) return -1
          aValue = aRoi
          bValue = bRoi
          break
        }
        case 'profit_per_unit': {
          const aProfit = getProfit(a)
          const bProfit = getProfit(b)
          const aPpu = aProfit !== null && a.qty > 0 ? aProfit / a.qty : null
          const bPpu = bProfit !== null && b.qty > 0 ? bProfit / b.qty : null
          if (aPpu === null) return 1
          if (bPpu === null) return -1
          aValue = aPpu
          bValue = bPpu
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
  const renderSortIcon = (field: SortField) => {
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
            <TableHead className="w-[120px]">
              <button
                onClick={() => handleSort('sa_name')}
                className="flex items-center font-medium hover:text-blue-600"
              >
                Артикул МП
                {renderSortIcon('sa_name')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('sa_name')}
                className="flex items-center font-medium hover:text-blue-600"
              >
                Артикул
                {renderSortIcon('sa_name')}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort('qty')}
                className="ml-auto flex items-center font-medium hover:text-blue-600"
              >
                Продано (шт)
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleSort('profit')}
                      className="ml-auto flex items-center font-medium hover:text-blue-600"
                    >
                      Прибыль
                      <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                      {renderSortIcon('profit')}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Операционная прибыль = Выручка − COGS − Все расходы</p>
                    <p className="text-xs text-gray-400">(логистика, хранение, комиссия, эквайринг и др.)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="text-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleSort('margin_pct')}
                      className="ml-auto flex items-center font-medium hover:text-blue-600"
                    >
                      Маржа %
                      <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                      {renderSortIcon('margin_pct')}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium">Операционная маржа =</p>
                    <p>(Прибыль ÷ |Выручка|) × 100%</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Где Прибыль = Выручка − COGS − Все расходы:</p>
                    <p className="text-xs text-gray-400">• Логистика (доставка + возврат)</p>
                    <p className="text-xs text-gray-400">• Хранение</p>
                    <p className="text-xs text-gray-400">• Комиссия WB, эквайринг, штрафы</p>
                    <p className="text-xs text-gray-400 mt-2">&gt;30% — отлично, 15-30% — хорошо, &lt;15% — низкая</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                      <p>Прибыль на единицу = Операционная прибыль ÷ Количество</p>
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
                      <p>ROI = (Операционная прибыль ÷ COGS) × 100%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
            )}
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item) => {
            const hasCogs = !item.missing_cogs_flag && item.cogs !== undefined

            // Use operating_profit from API (full expense formula)
            // See: docs/request-backend/63-operating-profit-formula-clarification.md
            const profit = hasCogs && item.operating_profit !== undefined && item.operating_profit !== null
              ? item.operating_profit
              : null

            // Calculate margin using API profit
            const margin = profit !== null && item.revenue_net !== 0
              ? (profit / Math.abs(item.revenue_net)) * 100
              : null

            // Calculate profit per unit using API profit
            const profitPerUnit = profit !== null && item.qty > 0
              ? profit / item.qty
              : null

            // Calculate ROI using API profit
            const roi = profit !== null && item.cogs && item.cogs > 0
              ? (profit / item.cogs) * 100
              : null

            return (
              <TableRow
                key={item.nm_id}
                className={cn(
                  'cursor-pointer hover:bg-gray-50',
                  item.missing_cogs_flag && 'bg-yellow-50/30'
                )}
                onClick={() => onProductClick && onProductClick(item.nm_id)}
              >
                <TableCell className="font-mono text-sm">
                  {item.nm_id}
                </TableCell>
                <TableCell>
                  <div className="max-w-md">
                    {/* DEFER-001: Show weeks coverage in tooltip when available (date range queries) */}
                    {(item.weeks_with_sales !== undefined || item.weeks_with_cogs !== undefined) ? (
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
                <TableCell className="text-right font-medium">
                  {item.qty.toLocaleString('ru-RU')}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCogs(item.revenue_net)}
                </TableCell>
                <TableCell className="text-right">
                  {hasCogs ? (
                    <span className="text-gray-700">
                      {formatCogs(item.cogs)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {item.missing_cogs_flag ? 'Не назначена' : '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {profit !== null ? (
                    <span
                      className={cn(
                        'font-medium',
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
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
                {/* Story 6.3-FE: Profit per Unit cell */}
                {showProfitPerUnit && (
                  <TableCell className="text-right">
                    {profitPerUnit !== null ? (
                      <span className={cn(
                        'font-medium',
                        profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatProfitPerUnit(profitPerUnit)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                )}
                {/* Story 6.3-FE: ROI cell */}
                {showROI && (
                  <TableCell className="text-right">
                    {roi !== null ? (
                      <span className={cn(
                        'font-medium',
                        getROIColor(roi)
                      )}>
                        {formatROI(roi)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {onProductClick && (
                    <button
                      onClick={(e) => {
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
          })}
        </TableBody>
      </Table>

      {/* DEFER-002: Summary Footer with optional comparison */}
      <ComparisonSummary
        current={{
          itemCount: data.length,
          totalRevenue: data.reduce((sum, item) => sum + item.revenue_net, 0),
          // Use API's operating_profit_rub (full expense formula)
          totalProfit: data.reduce((sum, item) => sum + (getProfit(item) || 0), 0),
          avgMargin: (() => {
            const withProfit = data.filter((item) => getProfit(item) !== null)
            if (withProfit.length === 0) return null
            const totalProfit = withProfit.reduce((sum, item) => sum + (getProfit(item) || 0), 0)
            const totalRevenue = withProfit.reduce((sum, item) => sum + item.revenue_net, 0)
            return totalRevenue !== 0 ? (totalProfit / Math.abs(totalRevenue)) * 100 : null
          })(),
        }}
        compare={comparisonTotals}
      />
    </div>
  )
}
