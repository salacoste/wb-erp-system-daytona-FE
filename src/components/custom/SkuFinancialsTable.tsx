'use client'

/**
 * SKU Financials Table Component
 * Epic 31: Complete Per-SKU Financial Analytics
 * Reference: frontend/docs/request-backend/64-per-sku-margin-missing-expenses-backend-response.md
 *
 * Key features:
 * - Storage from paid_storage_daily (Epic 24)
 * - Commission/acquiring as visibility fields (shown in tooltip)
 * - Operating profit = grossProfit - logistics - storage - penalties - paidAcceptance - otherAdjustments
 * - Request #68: otherAdjustments distributed proportionally by revenue from cabinet-level
 * - Profitability classification badges
 */

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
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, ArrowUpDown, HelpCircle, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  SkuFinancialItem,
  ProfitabilityStatus,
} from '@/types/sku-financials'
import {
  getProfitabilityBadgeClass,
  getProfitabilityLabel,
  getTotalOperatingExpenses,
} from '@/types/sku-financials'

// ============================================================
// TYPES
// ============================================================

/**
 * Sort fields for client-side table sorting (camelCase for JS object access)
 * Note: API uses snake_case (operating_profit, etc.) - see SkuFinancialsSortBy in types
 */
export type SortField =
  | 'productName'
  | 'salesQty'
  | 'revenueNet'
  | 'grossProfit'
  | 'operatingProfit'
  | 'operatingMarginPct'
  | 'storageCost'
  | 'logisticsCost'

export type SortOrder = 'asc' | 'desc'

export interface SkuFinancialsTableProps {
  data: SkuFinancialItem[]
  /** Show visibility columns (commission, acquiring) */
  showVisibility?: boolean
  /** Show detailed expense breakdown */
  showExpenseBreakdown?: boolean
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Format currency in Russian locale
 */
function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + ' ₽'
}

/**
 * Format percentage
 */
function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(1) + '%'
}

/**
 * Get color class based on value (positive = green, negative = red)
 */
function getValueColorClass(value: number | null): string {
  if (value === null) return 'text-gray-400'
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-600'
}

// ============================================================
// PROFITABILITY BADGE COMPONENT
// ============================================================

interface ProfitabilityBadgeProps {
  status: ProfitabilityStatus
  marginPct: number | null
}

function ProfitabilityBadge({ status, marginPct }: ProfitabilityBadgeProps) {
  const colorClass = getProfitabilityBadgeClass(status)
  const label = getProfitabilityLabel(status)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn('cursor-help', colorClass)}>
            {marginPct !== null ? `${marginPct.toFixed(1)}%` : label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{label}</p>
          {marginPct !== null && (
            <p className="text-xs text-gray-400">
              Операционная маржа: {marginPct.toFixed(2)}%
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================
// VISIBILITY TOOLTIP COMPONENT
// ============================================================

interface VisibilityTooltipProps {
  commission: number
  acquiring: number
}

function VisibilityTooltip({ commission, acquiring }: VisibilityTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-gray-400 hover:text-gray-600">
            <Eye className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-2">Удержания WB (уже в выручке)</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Комиссия WB:</span>
              <span>{formatCurrency(commission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Эквайринг:</span>
              <span>{formatCurrency(acquiring)}</span>
            </div>
            <div className="border-t pt-1 mt-1 flex justify-between font-medium">
              <span>Итого:</span>
              <span>{formatCurrency(commission + acquiring)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Эти суммы уже вычтены из gross для получения net выручки.
            НЕ добавляются в операционные расходы.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================
// EXPENSE BREAKDOWN TOOLTIP
// ============================================================

interface ExpenseBreakdownProps {
  item: SkuFinancialItem
}

function ExpenseBreakdown({ item }: ExpenseBreakdownProps) {
  const total = getTotalOperatingExpenses(item.costs)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted">
            {formatCurrency(total)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-2">Операционные расходы</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Логистика:</span>
              <span>{formatCurrency(item.costs.logistics)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Хранение (Storage API):</span>
              <span>{formatCurrency(item.costs.storage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Штрафы:</span>
              <span>{formatCurrency(item.costs.penalties)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Платная приёмка:</span>
              <span>{formatCurrency(item.costs.paidAcceptance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Прочие удержания:</span>
              <span>{formatCurrency(item.costs.otherAdjustments)}</span>
            </div>
            <div className="border-t pt-1 mt-1 flex justify-between font-medium">
              <span>Итого:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function SkuFinancialsTable({
  data,
  showVisibility = true,
  showExpenseBreakdown = true,
}: SkuFinancialsTableProps) {
  const [sortField, setSortField] = useState<SortField>('operatingProfit')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Sort data
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aValue: number | string | null = 0
      let bValue: number | string | null = 0

      switch (sortField) {
        case 'productName':
          aValue = a.productName.toLowerCase()
          bValue = b.productName.toLowerCase()
          break
        case 'salesQty':
          aValue = a.quantity.salesQty
          bValue = b.quantity.salesQty
          break
        case 'revenueNet':
          aValue = a.revenue.net
          bValue = b.revenue.net
          break
        case 'grossProfit':
          aValue = a.profit.gross
          bValue = b.profit.gross
          break
        case 'operatingProfit':
          aValue = a.profit.operating
          bValue = b.profit.operating
          break
        case 'operatingMarginPct':
          aValue = a.profit.operatingMarginPct
          bValue = b.profit.operatingMarginPct
          break
        case 'storageCost':
          aValue = a.costs.storage
          bValue = b.costs.storage
          break
        case 'logisticsCost':
          aValue = a.costs.logistics
          bValue = b.costs.logistics
          break
        default:
          aValue = a.profit.operating
          bValue = b.profit.operating
      }

      // Handle null values
      if (aValue === null) return 1
      if (bValue === null) return -1

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
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

  // Calculate totals for footer
  const totals = useMemo(() => {
    const totalSalesQty = data.reduce((sum, item) => sum + item.quantity.salesQty, 0)
    const totalReturnsQty = data.reduce((sum, item) => sum + item.quantity.returnsQty, 0)
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue.net, 0)
    const totalCogs = data.reduce((sum, item) => sum + (item.costs.cogs ?? 0), 0)
    const totalGrossProfit = data.reduce((sum, item) => sum + item.profit.gross, 0)
    const totalExpenses = data.reduce((sum, item) => sum + getTotalOperatingExpenses(item.costs), 0)
    const totalOperatingProfit = data.reduce((sum, item) => sum + item.profit.operating, 0)
    const avgMargin = totalRevenue > 0 ? (totalOperatingProfit / totalRevenue) * 100 : 0

    return {
      count: data.length,
      salesQty: totalSalesQty,
      returnsQty: totalReturnsQty,
      revenue: totalRevenue,
      cogs: totalCogs,
      grossProfit: totalGrossProfit,
      expenses: totalExpenses,
      operatingProfit: totalOperatingProfit,
      avgMargin,
    }
  }, [data])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">nm_id</TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('productName')}
                className="flex items-center font-medium hover:text-blue-600"
              >
                Артикул
                {renderSortIcon('productName')}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-2">Продано шт.</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-300">
                          Количество проданных единиц товара.
                        </p>
                        <p className="text-xs text-gray-400">
                          Возвраты НЕ вычитаются из этого числа.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <button
                  onClick={() => handleSort('salesQty')}
                  className="flex items-center font-medium hover:text-blue-600"
                >
                  Продано
                  {renderSortIcon('salesQty')}
                </button>
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-2">Выручка (net) — К перечислению</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          Сумма, которую WB перечисляет продавцу за реализованный товар.
                        </p>
                        <div className="bg-gray-800 rounded p-2 font-mono text-xs">
                          <p className="text-green-400">Выручка (net) =</p>
                          <p className="text-gray-400 pl-2">Продажи (net_for_pay)</p>
                          <p className="text-red-400 pl-2">− Возвраты (net_for_pay)</p>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <p>• <strong>net_for_pay</strong> — «К перечислению за товар» из отчёта WB</p>
                          <p>• Комиссия WB и эквайринг <u>уже вычтены</u> из этой суммы</p>
                          <p>• Это реальные деньги, которые поступят на счёт</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <button
                  onClick={() => handleSort('revenueNet')}
                  className="flex items-center font-medium hover:text-blue-600"
                >
                  Выручка (net)
                  {renderSortIcon('revenueNet')}
                </button>
              </div>
            </TableHead>
            <TableHead className="text-right">COGS</TableHead>
            <TableHead className="text-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center justify-end font-medium cursor-help">
                      Расходы
                      <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Логистика + Хранение + Штрафы + Приёмка + Прочие</p>
                    <p className="text-xs text-gray-400">
                      Комиссия и эквайринг уже вычтены из выручки
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort('operatingProfit')}
                className="ml-auto flex items-center font-medium hover:text-blue-600"
              >
                Опер. прибыль
                {renderSortIcon('operatingProfit')}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-2">Маржа % — Операционная маржинальность</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          Показывает, какой процент от выручки остаётся после вычета всех расходов.
                        </p>
                        <div className="bg-gray-800 rounded p-2 font-mono text-xs space-y-1">
                          <p className="text-green-400">Маржа % = (Опер. прибыль ÷ Выручка) × 100%</p>
                          <div className="border-t border-gray-700 mt-2 pt-2">
                            <p className="text-yellow-400">Опер. прибыль =</p>
                            <p className="text-gray-400 pl-2">Выручка (net)</p>
                            <p className="text-red-400 pl-2">− COGS (себестоимость)</p>
                            <p className="text-red-400 pl-2">− Логистика</p>
                            <p className="text-red-400 pl-2">− Хранение</p>
                            <p className="text-red-400 pl-2">− Штрафы</p>
                            <p className="text-red-400 pl-2">− Платная приёмка</p>
                            <p className="text-red-400 pl-2">− Прочие удержания</p>
                          </div>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-green-400">• &gt;25% — Отлично</p>
                          <p className="text-blue-400">• 15-25% — Хорошо</p>
                          <p className="text-yellow-400">• 5-15% — Внимание</p>
                          <p className="text-orange-400">• 0-5% — Критично</p>
                          <p className="text-red-400">• &lt;0% — Убыток</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <button
                  onClick={() => handleSort('operatingMarginPct')}
                  className="flex items-center font-medium hover:text-blue-600"
                >
                  Маржа %
                  {renderSortIcon('operatingMarginPct')}
                </button>
              </div>
            </TableHead>
            {showVisibility && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item) => (
            <TableRow
              key={item.nmId}
              className={cn(
                'hover:bg-gray-50',
                item.missingCogs && 'bg-yellow-50/30'
              )}
            >
              <TableCell className="font-mono text-sm text-gray-500">
                {item.nmId}
              </TableCell>
              <TableCell>
                <div className="max-w-[200px]">
                  <div className="truncate font-medium">{item.productName}</div>
                  {item.brand && (
                    <div className="truncate text-xs text-gray-400">{item.brand}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium cursor-help">
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
                          <span className="font-medium">{item.quantity.salesQty - item.quantity.returnsQty} шт.</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.revenue.net)}
              </TableCell>
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
                <span className={cn('font-medium', getValueColorClass(item.profit.operating))}>
                  {formatCurrency(item.profit.operating)}
                </span>
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
          ))}
        </TableBody>
      </Table>

      {/* Summary Footer */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">Товаров:</span>{' '}
            <span className="font-medium">{totals.count}</span>
          </div>
          <div>
            <span className="text-gray-500">Продано:</span>{' '}
            <span className="font-medium">{totals.salesQty} шт.</span>
            {totals.returnsQty > 0 && (
              <span className="text-xs text-gray-400 ml-1">
                (возвр. {totals.returnsQty})
              </span>
            )}
          </div>
          <div>
            <span className="text-gray-500">Выручка:</span>{' '}
            <span className="font-medium">{formatCurrency(totals.revenue)}</span>
          </div>
          <div>
            <span className="text-gray-500">COGS:</span>{' '}
            <span className="font-medium">{formatCurrency(totals.cogs)}</span>
          </div>
          <div>
            <span className="text-gray-500">Расходы:</span>{' '}
            <span className="font-medium">{formatCurrency(totals.expenses)}</span>
          </div>
          <div>
            <span className="text-gray-500">Опер. прибыль:</span>{' '}
            <span className={cn('font-medium', getValueColorClass(totals.operatingProfit))}>
              {formatCurrency(totals.operatingProfit)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Ср. маржа:</span>{' '}
            <span className={cn('font-medium', getValueColorClass(totals.avgMargin))}>
              {formatPercent(totals.avgMargin)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
