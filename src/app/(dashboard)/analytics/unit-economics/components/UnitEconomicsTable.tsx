'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { cn } from '@/lib/utils'
import type { UnitEconomicsItem } from '@/types/unit-economics'
import {
  formatCurrency,
  formatPercentage,
  getProfitabilityColor,
  getProfitabilityLabel,
  getProfitabilityBgClass,
} from '@/lib/unit-economics-utils'
import {
  PAGE_SIZE_OPTIONS,
  MarginIndicator,
  getSortIcon,
  CostCell,
} from './unit-economics-table-utils'
import { UnitEconomicsTablePagination } from './UnitEconomicsTablePagination'

/** Unit Economics Data Table — Story 5.2 (UX-001 sticky header, UX-002 pagination). */

interface UnitEconomicsTableProps {
  data: UnitEconomicsItem[]
  sortBy: 'revenue' | 'net_margin_pct'
  sortOrder: 'asc' | 'desc'
  onSort: (field: 'revenue' | 'net_margin_pct') => void
  selectedSku?: string
  onSelectSku?: (skuId: string | undefined) => void
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
  useEffect(() => {
    if (currentPage > Math.ceil(data.length / pageSize)) {
      setCurrentPage(1)
    }
  }, [data.length, pageSize, currentPage])

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
                  {getSortIcon('revenue', sortBy, sortOrder)}
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
                  Маржа %{getSortIcon('net_margin_pct', sortBy, sortOrder)}
                </Button>
              </TableHead>
              <TableHead className="text-center">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map(item => {
              const totalLogistics =
                item.costs_pct.logistics_delivery + item.costs_pct.logistics_return
              const isSelected = selectedSku === item.sku_id

              return (
                <TableRow
                  key={item.sku_id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                  )}
                  onClick={() => onSelectSku?.(isSelected ? undefined : item.sku_id)}
                >
                  <TableCell className="font-mono text-sm text-gray-600">{item.sku_id}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={item.product_name}>
                      {item.product_name}
                    </div>
                    <div className="text-xs text-gray-400">{item.brand}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.revenue)}
                  </TableCell>
                  <CostCell value={item.costs_pct.cogs} highThreshold={50} medThreshold={40} />
                  <CostCell value={item.costs_pct.commission} highThreshold={20} />
                  <CostCell value={totalLogistics} highThreshold={15} />
                  <CostCell value={item.costs_pct.storage} highThreshold={5} />
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <MarginIndicator value={item.net_margin_pct} />
                      <span
                        className={cn(
                          'font-medium',
                          item.net_margin_pct >= 20 && 'text-green-600',
                          item.net_margin_pct >= 10 && item.net_margin_pct < 20 && 'text-gray-700',
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
                      className={cn('text-xs', getProfitabilityBgClass(item.profitability_status))}
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
      <UnitEconomicsTablePagination
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={data.length}
        showPagination={showPagination}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageSizeChange={handlePageSizeChange}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
