'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { BulkCogsProduct } from './bulk-cogs.types'

interface BulkCogsProductTableProps {
  products: BulkCogsProduct[]
  selectedProducts: Set<string>
  allVisibleSelected: boolean
  onProductSelect: (nmId: string, checked: boolean) => void
  onSelectAll: () => void
  /** Pagination */
  totalProducts: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onNextPage: () => void
  onPrevPage: () => void
}

/**
 * Product table with checkboxes and cursor-based pagination
 * Story 4.2: Bulk COGS Assignment Capability
 */
export function BulkCogsProductTable({
  products,
  selectedProducts,
  allVisibleSelected,
  onProductSelect,
  onSelectAll,
  totalProducts,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
}: BulkCogsProductTableProps) {
  return (
    <>
      {/* Product List with Checkboxes */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Выбрать все"
                />
              </TableHead>
              <TableHead className="w-[120px]">Артикул</TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="w-[140px]">Бренд</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow
                key={product.nm_id}
                className={selectedProducts.has(product.nm_id) ? 'bg-blue-50' : ''}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.has(product.nm_id)}
                    onCheckedChange={checked => onProductSelect(product.nm_id, checked as boolean)}
                    aria-label={`Выбрать ${product.nm_id}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{product.nm_id}</TableCell>
                <TableCell className="font-medium">{product.sa_name}</TableCell>
                <TableCell className="text-sm text-gray-600">{product.brand || '\u2014'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Показано {products.length} из {totalProducts} товаров
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={!hasPrevPage}
            type="button"
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage}
            type="button"
          >
            Вперёд
          </Button>
        </div>
      </div>
    </>
  )
}
