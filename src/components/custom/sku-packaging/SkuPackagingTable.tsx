'use client'

/** DataTable for SKU Packaging listing — Epic 75-FE, Story 75.3 (AC: #3) */

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pencil, Trash2 } from 'lucide-react'
import type { SkuPackaging } from '@/types/shipment-cost'
import { SKU_PACKAGING_COLUMNS } from './sku-packaging-columns'

interface SkuPackagingTableProps {
  items: SkuPackaging[]
  onEdit: (item: SkuPackaging) => void
  onDelete: (item: SkuPackaging) => void
}

function formatProduct(item: SkuPackaging): string {
  const name = item.product?.subject || item.product?.vendorCode || ''
  return name ? `${item.nmId} — ${name}` : String(item.nmId)
}

export function SkuPackagingTable({ items, onEdit, onDelete }: SkuPackagingTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {SKU_PACKAGING_COLUMNS.map(col => (
                <TableHead key={col.key} className={col.align === 'right' ? 'text-right' : ''}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.nmId}>
                <TableCell className="font-medium">{formatProduct(item)}</TableCell>
                <TableCell>{item.boxType?.name ?? '—'}</TableCell>
                <TableCell className="text-right">{item.unitsPerBox}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      aria-label="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
