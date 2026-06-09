'use client'

import { useState, useMemo, useEffect } from 'react'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { UnitEconomicsItem } from '@/types/unit-economics'
import type { UeTableSortField } from '../useUnitEconomicsPageState'
import { PAGE_SIZE_OPTIONS, getSortIcon } from './unit-economics-table-utils'
import { UnitEconomicsTablePagination } from './UnitEconomicsTablePagination'
import { UnitEconomicsTableRow } from './UnitEconomicsTableRow'

/** Unit Economics Data Table — Story 5.2 + Story 77.5 (row extraction, delivery column). */

interface UnitEconomicsTableProps {
  data: UnitEconomicsItem[]
  sortBy: UeTableSortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: UeTableSortField) => void
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
    <div className="rounded-md border bg-card">
      {/* Scrollable container with max height for sticky header effect */}
      <div className="max-h-[600px] overflow-auto">
        <Table aria-label="Юнит-экономика по товарам">
          {/* Sticky header - UX-001 fix */}
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="bg-muted">
              <TableHead className="w-[100px]">Артикул</TableHead>
              <TableHead className="min-w-[200px]">Название</TableHead>
              <TableHead
                className="text-right"
                aria-sort={sortBy === 'revenue' ? (`${sortOrder}ending` as const) : 'none'}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => onSort('revenue')}
                  aria-label="Сортировать по выручке"
                >
                  Выручка
                  {getSortIcon('revenue', sortBy, sortOrder)}
                </Button>
              </TableHead>
              <TableHead className="text-right">COGS %</TableHead>
              <TableHead className="text-right">Комиссия %</TableHead>
              <TableHead className="text-right">Логистика %</TableHead>
              <TableHead className="text-right">Хранение %</TableHead>
              <TableHead
                className="text-right"
                title="Стоимость доставки на единицу товара из последней подтверждённой отправки"
                aria-sort={
                  sortBy === 'delivery_to_warehouse' ? (`${sortOrder}ending` as const) : 'none'
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => onSort('delivery_to_warehouse')}
                  aria-label="Сортировать по доставке"
                >
                  Доставка %{getSortIcon('delivery_to_warehouse', sortBy, sortOrder)}
                </Button>
              </TableHead>
              <TableHead
                className="text-right"
                aria-sort={sortBy === 'net_margin_pct' ? (`${sortOrder}ending` as const) : 'none'}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => onSort('net_margin_pct')}
                  aria-label="Сортировать по марже"
                >
                  Маржа %{getSortIcon('net_margin_pct', sortBy, sortOrder)}
                </Button>
              </TableHead>
              <TableHead className="text-center">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map(item => (
              <UnitEconomicsTableRow
                key={item.sku_id}
                item={item}
                isSelected={selectedSku === item.sku_id}
                onSelect={() =>
                  onSelectSku?.(selectedSku === item.sku_id ? undefined : item.sku_id)
                }
              />
            ))}
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
