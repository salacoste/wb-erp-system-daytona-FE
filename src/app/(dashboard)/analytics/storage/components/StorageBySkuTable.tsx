'use client'

/**
 * Storage by SKU Table
 * Story 24.3-FE: Storage by SKU Table
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * State/logic: useStorageBySkuTable hook
 * Formatters/types: storage-sku-table-utils
 * Header row: StorageSkuTableHeader
 */

import { Search, PackageX, Calendar } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { WarehouseBadges } from './WarehouseBadges'
import { StorageSkuTableHeader } from './StorageSkuTableHeader'
import { useStorageBySkuTable } from './useStorageBySkuTable'
import {
  type StorageBySkuTableProps,
  SKELETON_COLUMNS,
  SKELETON_ROWS,
  formatCurrency,
  formatVolume,
} from './storage-sku-table-utils'

export function StorageBySkuTable(props: StorageBySkuTableProps) {
  const { data, isLoading = false } = props
  const {
    sortField,
    sortOrder,
    searchQuery,
    debouncedQuery,
    filteredAndSortedData,
    handleSort,
    handleRowClick,
    handleSearchChange,
  } = useStorageBySkuTable(props)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(SKELETON_COLUMNS)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(SKELETON_ROWS)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(SKELETON_COLUMNS)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input with result count */}
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по артикулу, бренду..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        {debouncedQuery && (
          <span className="text-sm text-muted-foreground">
            Найдено: {filteredAndSortedData.length} из {data.length}
          </span>
        )}
      </div>

      {/* Table with horizontal scroll for mobile (UX Decision Q7) */}
      <div className="overflow-x-auto border rounded-lg">
        <Table className="min-w-[900px]">
          <StorageSkuTableHeader sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
          <TableBody>
            {filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {debouncedQuery ? 'Ничего не найдено' : 'Нет товаров с данными о хранении'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedData.map(item => (
                <TableRow
                  key={item.nm_id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(item.nm_id)}
                >
                  <TableCell className="font-mono text-sm" title={`nmId: ${item.nm_id}`}>
                    {item.vendor_code || item.nm_id}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.product_name || '—'}
                  </TableCell>
                  <TableCell className="text-sm">{item.brand || '—'}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-0.5">
                      <span>{formatCurrency(item.storage_cost_total)}</span>
                      {/* Request #156: FBO/FBS storage split */}
                      {(item.storage_fbo != null || item.storage_fbs != null) && (
                        <span className="text-[10px] text-muted-foreground">
                          {item.storage_fbo != null && `FBO: ${formatCurrency(item.storage_fbo)}`}
                          {item.storage_fbo != null && item.storage_fbs != null && ' / '}
                          {item.storage_fbs != null && `FBS: ${formatCurrency(item.storage_fbs)}`}
                        </span>
                      )}
                      {item.last_charge_date && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(item.last_charge_date).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {item.has_warehouse_stock === false && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                          <PackageX className="h-2.5 w-2.5" />
                          Нет на складе
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatCurrency(item.storage_cost_avg_daily)}
                  </TableCell>
                  <TableCell className="text-sm">{formatVolume(item.volume_avg)}</TableCell>
                  <TableCell>
                    <WarehouseBadges warehouses={item.warehouses} maxVisible={2} />
                  </TableCell>
                  <TableCell className="text-sm">{item.days_stored}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
