'use client'

/**
 * Box line table within a pallet — displays, add, edit, remove
 * Epic 76-FE, Story 76.3 (AC: #1, #2, #3, #4, #7)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { useRemoveBoxLine } from '@/hooks/use-box-lines'
import type { BoxLine } from '@/types/shipment-cost'
import { BoxLineForm } from './BoxLineForm'
import { BoxLineTableRow } from './BoxLineTableRow'

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
              <BoxLineTableRow
                key={line.id}
                line={line}
                hasCalculated={hasCalculated}
                isDraft={isDraft}
                isHighlighted={highlightedLineIds?.includes(line.id) ?? false}
                onEdit={handleEdit}
                onRemove={handleRemove}
              />
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
