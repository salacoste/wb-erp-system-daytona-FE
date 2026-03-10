/**
 * ProductList Table Header - extracted for file size compliance
 * Story 4.1: Single Product COGS Assignment Interface
 */

import { TableHeader, TableRow } from '@/components/ui/table'
import { ResizableTableHead } from './ResizableTableHead'

interface ProductListTableHeaderProps {
  widths: Record<string, number>
  handleResize: (key: string, width: number) => void
  enableStorageDisplay: boolean
  enableSelection: boolean
}

export function ProductListTableHeader({
  widths,
  handleResize,
  enableStorageDisplay,
  enableSelection,
}: ProductListTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <ResizableTableHead columnKey="article" width={widths.article} onResize={handleResize}>
          Артикул
        </ResizableTableHead>
        <ResizableTableHead
          columnKey="vendor_code"
          width={widths.vendor_code}
          onResize={handleResize}
        >
          Арт. поставщика
        </ResizableTableHead>
        <ResizableTableHead columnKey="name" width={widths.name} onResize={handleResize}>
          Название
        </ResizableTableHead>
        <ResizableTableHead columnKey="cogs" width={widths.cogs} onResize={handleResize}>
          Себестоимость
        </ResizableTableHead>
        <ResizableTableHead
          columnKey="margin"
          width={widths.margin}
          onResize={handleResize}
          isLast={!enableStorageDisplay && !enableSelection}
        >
          Маржа
        </ResizableTableHead>
        {enableStorageDisplay && (
          <ResizableTableHead
            columnKey="storage"
            width={widths.storage}
            onResize={handleResize}
            isLast={!enableSelection}
          >
            Хранение
          </ResizableTableHead>
        )}
        {enableSelection && (
          <ResizableTableHead
            columnKey="actions"
            width={widths.actions}
            onResize={handleResize}
            isLast
          >
            Действия
          </ResizableTableHead>
        )}
      </TableRow>
    </TableHeader>
  )
}
