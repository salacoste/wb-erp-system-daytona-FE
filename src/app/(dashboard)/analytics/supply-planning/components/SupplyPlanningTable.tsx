'use client'

import { useState, useMemo } from 'react'
import { Search, X, Download, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { SupplyPlanningItem, StockoutRisk } from '@/types/supply-planning'
import { SupplyPlanningRow } from './SupplyPlanningRow'

/**
 * Supply Planning Table Component
 * Story 6.3: Stockout Table & Detail Panel
 * UX Specs by Sally (2025-12-12)
 *
 * Main table displaying all SKUs with stock data,
 * sorting, filtering, search, and pagination.
 */

interface SupplyPlanningTableProps {
  data: SupplyPlanningItem[]
  activeFilter: StockoutRisk | null
  onClearFilter: () => void
}

type SortField =
  | 'stockout_risk'
  | 'sku_id'
  | 'product_name'
  | 'current_stock'
  | 'in_transit'
  | 'avg_daily_sales'
  | 'days_until_stockout'
  | 'reorder_quantity'
  | 'reorder_value'

type SortOrder = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [25, 50, 100]

export function SupplyPlanningTable({
  data,
  activeFilter,
  onClearFilter,
}: SupplyPlanningTableProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Sort state
  const [sortField, setSortField] = useState<SortField>('days_until_stockout')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Expanded rows state (multiple can be open - UX Q9)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  // Handle row expand/collapse
  const handleToggleExpand = (skuId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(skuId)) {
        next.delete(skuId)
      } else {
        next.add(skuId)
      }
      return next
    })
  }

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        item =>
          item.sku_id.toLowerCase().includes(query) ||
          item.product_name.toLowerCase().includes(query)
      )
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'stockout_risk':
          const riskOrder: Record<StockoutRisk, number> = {
            out_of_stock: 0,
            critical: 1,
            warning: 2,
            low: 3,
            healthy: 4,
          }
          comparison = riskOrder[a.stockout_risk] - riskOrder[b.stockout_risk]
          break
        case 'sku_id':
          comparison = a.sku_id.localeCompare(b.sku_id)
          break
        case 'product_name':
          comparison = a.product_name.localeCompare(b.product_name)
          break
        case 'current_stock':
          comparison = a.current_stock - b.current_stock
          break
        case 'in_transit':
          comparison = a.in_transit - b.in_transit
          break
        case 'avg_daily_sales':
          comparison = a.avg_daily_sales - b.avg_daily_sales
          break
        case 'days_until_stockout':
          const daysA = a.days_until_stockout ?? 9999
          const daysB = b.days_until_stockout ?? 9999
          comparison = daysA - daysB
          break
        case 'reorder_quantity':
          comparison = a.reorder_quantity - b.reorder_quantity
          break
        case 'reorder_value':
          comparison = a.reorder_value - b.reorder_value
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [data, searchQuery, sortField, sortOrder])

  // Pagination calculations
  const totalPages = Math.ceil(processedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, processedData.length)
  const paginatedData = processedData.slice(startIndex, endIndex)

  // Handle page size change
  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size))
    setCurrentPage(1)
  }

  // Handle search clear
  const handleClearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)
  }

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Статус',
      'Артикул',
      'Название',
      'Остаток',
      'В пути',
      'Скорость (шт/день)',
      'Дней до стокаута',
      'Рекомендация (шт)',
      'Сумма заказа (₽)',
    ]

    const rows = processedData.map(item => [
      item.stockout_risk,
      item.sku_id,
      item.product_name,
      item.current_stock,
      item.in_transit,
      item.avg_daily_sales.toFixed(1),
      item.days_until_stockout ?? 'N/A',
      item.reorder_quantity,
      item.reorder_value,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `supply-planning-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="h-3 w-3 opacity-30" />
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        {/* Toolbar: Search, Filter info, Export */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск по артикулу или названию..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter indicator and Export */}
          <div className="flex items-center gap-3">
            {activeFilter && (
              <Button variant="outline" size="sm" onClick={onClearFilter}>
                <X className="h-4 w-4 mr-1" />
                Сбросить фильтр
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {/* Expand chevron column */}
                <th className="w-10 px-2 py-3"></th>

                {/* Status */}
                <th
                  className="w-[60px] px-4 py-3 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('stockout_risk')}
                >
                  <div className="flex items-center justify-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Статус
                    <SortIndicator field="stockout_risk" />
                  </div>
                </th>

                {/* SKU */}
                <th
                  className="w-[100px] px-4 py-3 text-left cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('sku_id')}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Артикул
                    <SortIndicator field="sku_id" />
                  </div>
                </th>

                {/* Product Name */}
                <th
                  className="w-[200px] px-4 py-3 text-left cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('product_name')}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Название
                    <SortIndicator field="product_name" />
                  </div>
                </th>

                {/* Current Stock */}
                <th
                  className="w-[80px] px-4 py-3 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('current_stock')}
                >
                  <div className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Остаток
                    <SortIndicator field="current_stock" />
                  </div>
                </th>

                {/* In Transit */}
                <th
                  className="w-[80px] px-4 py-3 text-right cursor-pointer hover:bg-gray-200 transition-colors hidden lg:table-cell"
                  onClick={() => handleSort('in_transit')}
                >
                  <div className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    В пути
                    <SortIndicator field="in_transit" />
                  </div>
                </th>

                {/* Velocity */}
                <th
                  className="w-[100px] px-4 py-3 text-right cursor-pointer hover:bg-gray-200 transition-colors hidden lg:table-cell"
                  onClick={() => handleSort('avg_daily_sales')}
                >
                  <div className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Скорость
                    <SortIndicator field="avg_daily_sales" />
                  </div>
                </th>

                {/* Days Until Stockout */}
                <th
                  className="w-[120px] px-4 py-3 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('days_until_stockout')}
                >
                  <div className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Дней
                    <SortIndicator field="days_until_stockout" />
                  </div>
                </th>

                {/* Reorder Qty */}
                <th
                  className="w-[100px] px-4 py-3 text-right cursor-pointer hover:bg-gray-200 transition-colors hidden xl:table-cell"
                  onClick={() => handleSort('reorder_quantity')}
                >
                  <div className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Заказать
                    <SortIndicator field="reorder_quantity" />
                  </div>
                </th>

                {/* Reorder Value */}
                <th
                  className="w-[120px] px-4 py-3 text-right cursor-pointer hover:bg-gray-200 transition-colors hidden xl:table-cell"
                  onClick={() => handleSort('reorder_value')}
                >
                  <div className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Сумма
                    <SortIndicator field="reorder_value" />
                  </div>
                </th>

                {/* Action */}
                <th className="w-[140px] px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Действие
                  </span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                    {searchQuery
                      ? `Товары по запросу "${searchQuery}" не найдены`
                      : 'Нет данных для отображения'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <SupplyPlanningRow
                    key={item.sku_id}
                    item={item}
                    isExpanded={expandedRows.has(item.sku_id)}
                    onToggleExpand={() => handleToggleExpand(item.sku_id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {processedData.length > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t px-4 py-3">
            {/* Results count */}
            <div className="text-sm text-gray-600">
              Показано {startIndex + 1}–{endIndex} из {processedData.length} товаров
              {activeFilter && (
                <span className="ml-1 text-gray-400">
                  (фильтр: {activeFilter})
                </span>
              )}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-4">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">На странице:</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 px-2"
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2"
                >
                  ‹
                </Button>

                <span className="px-3 text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2"
                >
                  ›
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2"
                >
                  »
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
