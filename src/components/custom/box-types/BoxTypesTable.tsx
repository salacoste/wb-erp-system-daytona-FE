'use client'

/**
 * DataTable for Box Types listing
 * Epic 75-FE, Story 75.2 (AC: #2, #6)
 */

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
import { parseDecimal } from '@/lib/decimal-utils'
import type { BoxType } from '@/types/shipment-cost'
import { BOX_TYPES_COLUMNS } from './box-types-columns'

interface BoxTypesTableProps {
  boxTypes: BoxType[]
  onEdit: (boxType: BoxType) => void
  onDeactivate: (boxType: BoxType) => void
}

function formatDimensions(bt: BoxType): string {
  const l = parseDecimal(bt.lengthCm)
  const w = parseDecimal(bt.widthCm)
  const h = parseDecimal(bt.heightCm)
  return `${l} × ${w} × ${h}`
}

function formatVolume(volumeCm3: string): string {
  return parseDecimal(volumeCm3).toLocaleString('ru-RU')
}

export function BoxTypesTable({ boxTypes, onEdit, onDeactivate }: BoxTypesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {BOX_TYPES_COLUMNS.map(col => (
                <TableHead key={col.key} className={col.align === 'right' ? 'text-right' : ''}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {boxTypes.map(bt => (
              <TableRow key={bt.id}>
                <TableCell className="font-medium">{bt.name}</TableCell>
                <TableCell className="text-right">{formatDimensions(bt)}</TableCell>
                <TableCell className="text-right">{formatVolume(bt.volumeCm3)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(bt)}
                      aria-label="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeactivate(bt)}
                      aria-label="Деактивировать"
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
