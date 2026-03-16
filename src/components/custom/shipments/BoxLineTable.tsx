'use client'

/**
 * Box line table within a pallet — displays, add, edit, remove
 * Epic 76-FE, Story 76.3 (AC: #1, #2, #3, #4, #7)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useRemoveBoxLine } from '@/hooks/use-box-lines'
import { parseDecimal } from '@/lib/decimal-utils'
import { formatCurrency } from '@/lib/utils'
import type { BoxLine } from '@/types/shipment-cost'
import { BoxLineForm } from './BoxLineForm'

interface BoxLineTableProps {
  shipmentId: string
  palletId: string
  boxLines: BoxLine[]
  isDraft: boolean
  highlightedLineIds?: string[]
}

export function BoxLineTable({
  shipmentId,
  palletId,
  boxLines,
  isDraft,
  highlightedLineIds,
}: BoxLineTableProps) {
  const hasCalculated = boxLines.some(l => l.finalCostPerUnit !== null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<BoxLine | null>(null)
  const { mutateAsync: removeAsync } = useRemoveBoxLine(shipmentId)

  function handleEdit(line: BoxLine) {
    setEditingLine(line)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingLine(null)
  }

  async function handleRemove(boxLineId: string) {
    try {
      await removeAsync(boxLineId)
    } catch {
      // Error handled by TanStack Query
    }
  }

  return (
    <div className="space-y-3">
      {boxLines.length === 0 ? (
        <p className="text-sm text-muted-foreground">Товары ещё не добавлены</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead className="text-right">Коробок</TableHead>
              <TableHead className="text-right">Всего штук</TableHead>
              {hasCalculated && <TableHead className="text-right">PCU</TableHead>}
              {hasCalculated && <TableHead className="text-right">DCU</TableHead>}
              {hasCalculated && <TableHead className="text-right">FCU</TableHead>}
              {hasCalculated && <TableHead className="text-right">Итого</TableHead>}
              {isDraft && <TableHead className="text-right">Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {boxLines.map(line => (
              <TableRow
                key={line.id}
                className={
                  highlightedLineIds?.includes(line.id)
                    ? 'bg-destructive/10 border-l-2 border-l-destructive'
                    : ''
                }
              >
                <TableCell className="font-medium">{line.nmId}</TableCell>
                <TableCell className="text-right">{line.boxCount}</TableCell>
                <TableCell className="text-right">{line.totalUnits ?? '—'}</TableCell>
                {hasCalculated && (
                  <TableCell className="text-right">
                    {line.unitCostRub ? formatCurrency(parseDecimal(line.unitCostRub)) : '—'}
                  </TableCell>
                )}
                {hasCalculated && (
                  <TableCell className="text-right">
                    {line.deliveryCostPerUnit
                      ? formatCurrency(parseDecimal(line.deliveryCostPerUnit))
                      : '—'}
                  </TableCell>
                )}
                {hasCalculated && (
                  <TableCell className="text-right font-medium">
                    {line.finalCostPerUnit
                      ? formatCurrency(parseDecimal(line.finalCostPerUnit))
                      : '—'}
                  </TableCell>
                )}
                {hasCalculated && (
                  <TableCell className="text-right">
                    {line.finalCostLine ? formatCurrency(parseDecimal(line.finalCostLine)) : '—'}
                  </TableCell>
                )}
                {isDraft && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(line)}
                        aria-label={`Редактировать товар ${line.nmId}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Удалить товар ${line.nmId}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить товар {line.nmId}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Строка будет удалена из паллеты.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemove(line.id)}>
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isDraft && (
        <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Добавить товар
        </Button>
      )}

      <BoxLineForm
        open={formOpen}
        onClose={handleCloseForm}
        shipmentId={shipmentId}
        palletId={palletId}
        editingLine={editingLine}
      />
    </div>
  )
}
