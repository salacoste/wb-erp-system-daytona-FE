'use client'

import { useState } from 'react'
import { Search, X, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { SupplyPlanningItem, StockoutRisk } from '@/types/supply-planning'
import { SupplyPlanningRow } from './SupplyPlanningRow'
import { SupplyTableHeader } from './SupplyTableHeader'
import { SupplyTablePagination } from './SupplyTablePagination'
import { useSupplyTableFilters } from './useSupplyTableFilters'
import { useSupplyTablePagination } from './useSupplyTablePagination'
import { exportSupplyTableCSV } from './supply-table-export'

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

export function SupplyPlanningTable({
  data,
  activeFilter,
  onClearFilter,
}: SupplyPlanningTableProps) {
  // Expanded rows state (multiple can be open - UX Q9)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const {
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    handleSort,
    handleClearSearch,
    processedData,
  } = useSupplyTableFilters(data)

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    handlePageSizeChange,
    resetPage,
    PAGE_SIZE_OPTIONS,
  } = useSupplyTablePagination(processedData.length)

  // Paginate processed data
  const paginatedData = processedData.slice(startIndex, endIndex)

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

  return (
    <Card>
      {/* sr-only h2 — page renders h1 in SupplyPlanningHeader; labels this table section so the
          expanded-row detail panel h3 (SupplyPlanningDetail) doesn't skip h1→h3. */}
      <h2 className="sr-only">Детализация по поставкам</h2>
      <CardHeader className="pb-4">
        {/* Toolbar: Search, Filter info, Export */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search — min-h-11 touch target + aria-label linkage (169.13) */}
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Поиск по артикулу или названию..."
              aria-label="Поиск по артикулу или названию"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                resetPage()
              }}
              className="pl-9 pr-9 min-h-11"
            />
            {searchQuery && (
              <button
                onClick={() => handleClearSearch(resetPage)}
                aria-label="Очистить поиск"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

            {/* BEHAVIOR PIN (Story 169.13): export uses the FULL filtered processedData,
                NOT the current page slice — preserved as-is, do not "fix". */}
            <Button variant="outline" size="sm" onClick={() => exportSupplyTableCSV(processedData)}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Table — scroll region is keyboard-reachable (169.13 a11y) */}
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Таблица планирования поставок по артикулам"
        >
          <table className="w-full">
            {/* Static caption — period/filters are visible in the toolbar; no dynamic text (169.13) */}
            <caption className="sr-only">Планирование поставок по артикулам</caption>
            <SupplyTableHeader
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={field => handleSort(field, resetPage)}
            />

            {/* Table Body */}
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    {searchQuery
                      ? `Товары по запросу "${searchQuery}" не найдены`
                      : 'Нет данных для отображения'}
                  </td>
                </tr>
              ) : (
                paginatedData.map(item => (
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
          <SupplyTablePagination
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={processedData.length}
            activeFilter={activeFilter}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={setCurrentPage}
          />
        )}
      </CardContent>
    </Card>
  )
}
