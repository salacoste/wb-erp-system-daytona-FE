'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { UnitEconomicsItem } from '@/types/unit-economics'
import {
  formatCurrency,
  formatPercentage,
  getProfitabilityColor,
  getProfitabilityLabel,
  getProfitabilityBgClass,
} from '@/lib/unit-economics-utils'

/**
 * Unit Economics Data Table
 * Story 5.2: Unit Economics Page Structure
 * UX Specs by Sally (2025-12-09)
 *
 * Features:
 * - Sticky header for scrolling large datasets (UX-001)
 * - Pagination controls for 50+ SKUs (UX-002)
 * - Sortable columns (Revenue, Net Margin %)
 * - Color-coded profitability status
 * - Row selection for waterfall chart
 */

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const

interface UnitEconomicsTableProps {
  data: UnitEconomicsItem[]
  sortBy: 'revenue' | 'net_margin_pct'
  sortOrder: 'asc' | 'desc'
  onSort: (field: 'revenue' | 'net_margin_pct') => void
  selectedSku?: string
  onSelectSku?: (skuId: string | undefined) => void
}

function MarginIndicator({ value }: { value: number }) {
  if (value >= 20) {
    return <TrendingUp className="h-4 w-4 text-green-500" />
  }
  if (value < 10) {
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }
  return <Minus className="h-4 w-4 text-gray-400" />
}

export function UnitEconomicsTable({
  data,
  sortBy,
  sortOrder,
  onSort,
  selectedSku,
  onSelectSku,
}: UnitEconomicsTableProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50)

  // Calculate pagination
  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex]
  )

  // Reset to page 1 when data changes
  useMemo(() => {
    if (currentPage > Math.ceil(data.length / pageSize)) {
      setCurrentPage(1)
    }
  }, [data.length, pageSize, currentPage])

  const getSortIcon = (field: 'revenue' | 'net_margin_pct') => {
    if (sortBy !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />
    }
    return (
      <ArrowUpDown
        className={cn(
          'ml-2 h-4 w-4',
          sortOrder === 'asc' ? 'text-blue-500' : 'text-blue-500'
        )}
      />
    )
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number])
    setCurrentPage(1)
  }

  // Show pagination only for larger datasets
  const showPagination = data.length > PAGE_SIZE_OPTIONS[0]

  return (
    <div className="rounded-md border bg-white">
      {/* Scrollable container with max height for sticky header effect */}
      <div className="max-h-[600px] overflow-auto">
        <Table>
          {/* Sticky header - UX-001 fix */}
          <TableHeader className="sticky top-0 z-10 bg-gray-50">
            <TableRow className="bg-gray-50">
            <TableHead className="w-[100px]">Артикул</TableHead>
            <TableHead className="min-w-[200px]">Название</TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => onSort('revenue')}
              >
                Выручка
                {getSortIcon('revenue')}
              </Button>
            </TableHead>
            <TableHead className="text-right">COGS %</TableHead>
            <TableHead className="text-right">Комиссия %</TableHead>
            <TableHead className="text-right">Логистика %</TableHead>
            <TableHead className="text-right">Хранение %</TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => onSort('net_margin_pct')}
              >
                Маржа %
                {getSortIcon('net_margin_pct')}
              </Button>
            </TableHead>
            <TableHead className="text-center">Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item) => {
            const totalLogistics =
              item.costs_pct.logistics_delivery + item.costs_pct.logistics_return
            const isSelected = selectedSku === item.sku_id

            return (
              <TableRow
                key={item.sku_id}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50'
                )}
                onClick={() => onSelectSku?.(isSelected ? undefined : item.sku_id)}
              >
                <TableCell className="font-mono text-sm text-gray-600">
                  {item.sku_id}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={item.product_name}>
                    {item.product_name}
                  </div>
                  <div className="text-xs text-gray-400">{item.brand}</div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.revenue)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      item.costs_pct.cogs > 50 && 'text-red-600 font-medium',
                      item.costs_pct.cogs > 40 &&
                        item.costs_pct.cogs <= 50 &&
                        'text-orange-600',
                      item.costs_pct.cogs <= 40 && 'text-gray-700'
                    )}
                  >
                    {formatPercentage(item.costs_pct.cogs)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      item.costs_pct.commission > 20 && 'text-orange-600',
                      item.costs_pct.commission <= 20 && 'text-gray-700'
                    )}
                  >
                    {formatPercentage(item.costs_pct.commission)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      totalLogistics > 15 && 'text-orange-600',
                      totalLogistics <= 15 && 'text-gray-700'
                    )}
                  >
                    {formatPercentage(totalLogistics)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      item.costs_pct.storage > 5 && 'text-orange-600',
                      item.costs_pct.storage <= 5 && 'text-gray-700'
                    )}
                  >
                    {formatPercentage(item.costs_pct.storage)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <MarginIndicator value={item.net_margin_pct} />
                    <span
                      className={cn(
                        'font-medium',
                        item.net_margin_pct >= 20 && 'text-green-600',
                        item.net_margin_pct >= 10 &&
                          item.net_margin_pct < 20 &&
                          'text-gray-700',
                        item.net_margin_pct < 10 && 'text-red-600'
                      )}
                    >
                      {formatPercentage(item.net_margin_pct)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      getProfitabilityBgClass(item.profitability_status)
                    )}
                    style={{ color: getProfitabilityColor(item.profitability_status) }}
                  >
                    {getProfitabilityLabel(item.profitability_status)}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>

      {/* Table footer with pagination - UX-002 fix */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Показано {startIndex + 1}–{Math.min(endIndex, data.length)} из {data.length} записей
          </div>

          {showPagination && (
            <div className="flex items-center gap-4">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Строк:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
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
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
