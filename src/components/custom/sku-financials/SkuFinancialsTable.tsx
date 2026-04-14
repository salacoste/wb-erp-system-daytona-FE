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
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { SkuFinancialItem } from '@/types/sku-financials'
import { getTotalOperatingExpenses } from '@/types/sku-financials'
import type { SortField, SortOrder } from './sku-table-sorting'
import { sortSkuData } from './sku-table-sorting'
import { SalesQtyHeader, RevenueNetHeader, ExpensesHeader, MarginHeader } from './SkuTableHeaders'
import { SkuRow } from './SkuRow'
import { SummaryFooter } from './SummaryFooter'

export type { SortField, SortOrder }

export interface SkuFinancialsTableProps {
  data: SkuFinancialItem[]
  /** Show visibility columns (commission, acquiring) */
  showVisibility?: boolean
  /** Show detailed expense breakdown */
  showExpenseBreakdown?: boolean
}

export function SkuFinancialsTable({
  data,
  showVisibility = true,
  showExpenseBreakdown = true,
}: SkuFinancialsTableProps) {
  const [sortField, setSortField] = useState<SortField>('operatingProfit')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedData = useMemo(
    () => sortSkuData(data, sortField, sortOrder),
    [data, sortField, sortOrder]
  )

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

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
        <p className="text-gray-600">Нет данных за выбранную неделю</p>
      </div>
    )
  }

  const totals = useMemo(() => {
    const totalSalesQty = data.reduce((sum, item) => sum + item.quantity.salesQty, 0)
    const totalReturnsQty = data.reduce((sum, item) => sum + item.quantity.returnsQty, 0)
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue.net, 0)
    const totalCogs = data.reduce((sum, item) => sum + (item.costs.cogs ?? 0), 0)
    // Story 87.3-FE: profit.gross/operating are null when COGS missing — coerce for aggregation only
    const totalGrossProfit = data.reduce((sum, item) => sum + (item.profit.gross ?? 0), 0)
    const totalExpenses = data.reduce((sum, item) => sum + getTotalOperatingExpenses(item.costs), 0)
    const totalOperatingProfit = data.reduce((sum, item) => sum + (item.profit.operating ?? 0), 0)
    const avgMargin = totalRevenue > 0 ? (totalOperatingProfit / totalRevenue) * 100 : 0

    // Story 87.3-FE: track COGS coverage for footnote
    const rowsWithCogs = data.filter(item => !item.missingCogs).length

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
      rowsWithCogs,
      totalRows: data.length,
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
              <SalesQtyHeader
                onSort={() => handleSort('salesQty')}
                sortIcon={renderSortIcon('salesQty')}
              />
            </TableHead>
            <TableHead className="text-right">
              <RevenueNetHeader
                onSort={() => handleSort('revenueNet')}
                sortIcon={renderSortIcon('revenueNet')}
              />
            </TableHead>
            <TableHead className="text-right">COGS</TableHead>
            <TableHead className="text-right">
              <ExpensesHeader />
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
              <MarginHeader
                onSort={() => handleSort('operatingMarginPct')}
                sortIcon={renderSortIcon('operatingMarginPct')}
              />
            </TableHead>
            {showVisibility && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map(item => (
            <SkuRow
              key={item.nmId}
              item={item}
              showExpenseBreakdown={showExpenseBreakdown}
              showVisibility={showVisibility}
            />
          ))}
        </TableBody>
      </Table>
      <SummaryFooter totals={totals} />
    </div>
  )
}
