'use client'

/**
 * Table header row for StorageBySkuTable with sortable columns and tooltips.
 * Extracted from StorageBySkuTable.tsx for file size compliance (Epic 74).
 * Story 24.3-FE: Storage by SKU Table
 */

import { ArrowUpDown, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SortField, SortOrder } from './storage-sku-table-utils'

interface StorageSkuTableHeaderProps {
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
}

/**
 * Story 169.12: aria-sort on every sortable header (169.1 Button+aria-sort
 * canon — the four sortable columns finally expose their sort semantics;
 * default storage_cost_total desc, same-field toggle desc→asc is owned by
 * useStorageBySkuTable and unchanged).
 */
function ariaSortValue(field: SortField, sortField: SortField, sortOrder: SortOrder) {
  if (sortField !== field) return undefined
  return sortOrder === 'asc' ? 'ascending' : 'descending'
}

/** Sort icon based on current sort state */
function SortIcon({
  field,
  sortField,
  sortOrder,
}: {
  field: SortField
  sortField: SortField
  sortOrder: 'asc' | 'desc'
}) {
  if (sortField !== field) {
    return <ArrowUpDown className="h-4 w-4 ml-1" />
  }
  return sortOrder === 'desc' ? (
    <ArrowDown className="h-4 w-4 ml-1" />
  ) : (
    <ArrowUp className="h-4 w-4 ml-1" />
  )
}

export function StorageSkuTableHeader({
  sortField,
  sortOrder,
  onSort,
}: StorageSkuTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[120px]">Артикул</TableHead>
        <TableHead className="w-[150px]">Название</TableHead>
        <TableHead className="w-[120px]">Бренд</TableHead>
        <TableHead
          className="w-[120px]"
          aria-sort={ariaSortValue('storage_cost_total', sortField, sortOrder)}
        >
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto font-medium hover:bg-transparent"
              onClick={() => onSort('storage_cost_total')}
            >
              Хранение
              <SortIcon field="storage_cost_total" sortField={sortField} sortOrder={sortOrder} />
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px]">
                  <p className="text-xs">Сумма начислений за хранение за период.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠ Это история начислений, не текущие остатки. Товар может быть уже продан.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableHead>
        <TableHead
          className="w-[100px]"
          aria-sort={ariaSortValue('storage_cost_avg_daily', sortField, sortOrder)}
        >
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto font-medium hover:bg-transparent"
              onClick={() => onSort('storage_cost_avg_daily')}
            >
              ₽/день
              <SortIcon
                field="storage_cost_avg_daily"
                sortField={sortField}
                sortOrder={sortOrder}
              />
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="text-xs">Средняя стоимость хранения в день за выбранный период.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableHead>
        <TableHead
          className="w-[70px]"
          aria-sort={ariaSortValue('volume_avg', sortField, sortOrder)}
        >
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto font-medium hover:bg-transparent"
            onClick={() => onSort('volume_avg')}
          >
            Объём
            <SortIcon field="volume_avg" sortField={sortField} sortOrder={sortOrder} />
          </Button>
        </TableHead>
        <TableHead className="w-[150px]">Склады</TableHead>
        <TableHead
          className="w-[60px]"
          aria-sort={ariaSortValue('days_stored', sortField, sortOrder)}
        >
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto font-medium hover:bg-transparent"
            onClick={() => onSort('days_stored')}
          >
            Дней
            <SortIcon field="days_stored" sortField={sortField} sortOrder={sortOrder} />
          </Button>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}
