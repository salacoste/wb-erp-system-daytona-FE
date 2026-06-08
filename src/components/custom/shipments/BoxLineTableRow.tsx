'use client'

/**
 * Single box line row with cost cells and action buttons
 * Epic 76-FE, Story 76.3
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Pencil, Trash2 } from 'lucide-react'
import { parseDecimal } from '@/lib/decimal-utils'
import { formatCurrency } from '@/lib/utils'
import type { BoxLine } from '@/types/shipment-cost'

/** Check whether a Decimal-string cost field has a valid finite value. */
function hasFiniteCost(value: string | null | undefined): boolean {
  return value != null && value !== '' && Number.isFinite(parseDecimal(value))
}

interface BoxLineTableRowProps {
  line: BoxLine
  hasCalculated: boolean
  isDraft: boolean
  isHighlighted: boolean
  onEdit: (line: BoxLine) => void
  onRemove: (boxLineId: string) => void
}

export function BoxLineTableRow({
  line,
  hasCalculated,
  isDraft,
  isHighlighted,
  onEdit,
  onRemove,
}: BoxLineTableRowProps) {
  return (
    <TableRow className={isHighlighted ? 'bg-destructive/10 border-l-2 border-l-destructive' : ''}>
      <TableCell className="font-medium">{line.nmId}</TableCell>
      <TableCell className="text-right">{line.boxCount}</TableCell>
      <TableCell className="text-right">{line.totalUnits ?? '—'}</TableCell>
      {hasCalculated && (
        <TableCell className="text-right">
          {hasFiniteCost(line.unitCostRub) ? formatCurrency(parseDecimal(line.unitCostRub)) : '—'}
        </TableCell>
      )}
      {hasCalculated && (
        <TableCell className="text-right">
          {hasFiniteCost(line.deliveryCostPerUnit)
            ? formatCurrency(parseDecimal(line.deliveryCostPerUnit))
            : '—'}
        </TableCell>
      )}
      {hasCalculated && (
        <TableCell className="text-right font-medium">
          {hasFiniteCost(line.finalCostPerUnit)
            ? formatCurrency(parseDecimal(line.finalCostPerUnit))
            : '—'}
        </TableCell>
      )}
      {hasCalculated && (
        <TableCell className="text-right">
          {hasFiniteCost(line.finalCostLine)
            ? formatCurrency(parseDecimal(line.finalCostLine))
            : '—'}
        </TableCell>
      )}
      {isDraft && (
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(line)}
              aria-label={`Редактировать товар ${line.nmId}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={`Удалить товар ${line.nmId}`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить товар {line.nmId}?</AlertDialogTitle>
                  <AlertDialogDescription>Строка будет удалена из паллеты.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemove(line.id)}>Удалить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}
