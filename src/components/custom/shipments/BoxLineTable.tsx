'use client'

/** Box line table within a pallet — Epic 76-FE, Story 76.3. */

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResponsiveTable } from '@/components/product/tables/ResponsiveTable'
import type {
  TableConsumerContract,
  TableNumericColumnContract,
} from '@/components/product/tables/contracts'
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

function currencyColumn(id: string, label: string): TableNumericColumnContract {
  return {
    id,
    label,
    alignment: 'end',
    precision: 'caller-preserved',
    unit: { kind: 'currency', code: 'RUB' },
    tabularNumerals: true,
    fullValueAccess: 'visible',
  }
}

const BOX_LINE_BASE_COLUMNS: TableNumericColumnContract[] = [
  {
    id: 'boxCount',
    label: 'Коробок',
    alignment: 'end',
    precision: 'integer',
    unit: { kind: 'count', label: 'коробок' },
    tabularNumerals: true,
    fullValueAccess: 'visible',
  },
  {
    id: 'totalUnits',
    label: 'Всего штук',
    alignment: 'end',
    precision: 'integer',
    unit: { kind: 'quantity', label: 'штук' },
    tabularNumerals: true,
    fullValueAccess: 'visible',
  },
]

export function boxLineTableContract(
  hasCalculated: boolean,
  isDraft: boolean
): TableConsumerContract {
  return {
    primaryColumn: { id: 'nmId', label: 'Товар' },
    numericColumns: [
      ...BOX_LINE_BASE_COLUMNS,
      ...(hasCalculated
        ? [
            currencyColumn('unitCostRub', 'PCU'),
            currencyColumn('deliveryCostPerUnit', 'DCU'),
            currencyColumn('finalCostPerUnit', 'FCU'),
            currencyColumn('finalCostLine', 'Итого'),
          ]
        : []),
    ],
    sorting: { kind: 'none' },
    selection: { kind: 'none' },
    rowActions: isDraft
      ? {
          kind: 'caller-rendered',
          accessibleNamePattern: 'Действия для товара {entityId}',
        }
      : { kind: 'none' },
    narrowStrategy: {
      kind: 'horizontal-scroll',
      regionLabel: 'Таблица товаров паллеты',
      minimumWidth: '64rem',
    },
    pagination: { kind: 'none' },
  }
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
  const [announcement, setAnnouncement] = useState('')
  const returnFocusRef = useRef<HTMLButtonElement | null>(null)
  const { mutateAsync: removeAsync } = useRemoveBoxLine(shipmentId)

  function handleEdit(line: BoxLine, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger
    setEditingLine(line)
    setFormOpen(true)
  }

  function handleAdd(trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger
    setEditingLine(null)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingLine(null)
  }

  async function handleRemove(boxLineId: string) {
    setAnnouncement('Удаляем товарную строку')
    try {
      await removeAsync(boxLineId)
      setAnnouncement('Товарная строка удалена')
    } catch {
      setAnnouncement('Не удалось удалить товарную строку')
    }
  }

  function handleFormSuccess(action: 'add' | 'update') {
    setAnnouncement(action === 'add' ? 'Товарная строка добавлена' : 'Товарная строка обновлена')
  }

  return (
    <div className="space-y-3">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {boxLines.length === 0 ? (
        <p className="text-sm text-muted-foreground">Товары ещё не добавлены</p>
      ) : (
        <ResponsiveTable
          accessibleLabel="Товары паллеты"
          contract={boxLineTableContract(hasCalculated, isDraft)}
        >
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
        </ResponsiveTable>
      )}

      {isDraft && (
        <Button size="sm" variant="outline" onClick={event => handleAdd(event.currentTarget)}>
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
        returnFocusRef={returnFocusRef}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
