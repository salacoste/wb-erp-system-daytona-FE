'use client'

/**
 * DataTable for Box Types listing
 * Epic 75-FE, Story 75.2 (AC: #2, #6)
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ResponsiveTable } from '@/components/product/tables'
import type { TableConsumerContract } from '@/components/product/tables/contracts'
import { StatusBadge } from '@/components/product/metrics'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pencil, Trash2 } from 'lucide-react'
import { parseDecimal } from '@/lib/decimal-utils'
import type { BoxType } from '@/types/shipment-cost'
import { BOX_TYPES_COLUMNS } from './box-types-columns'

interface BoxTypesTableProps {
  boxTypes: BoxType[]
  onEdit: (boxType: BoxType, trigger: HTMLButtonElement) => void
  onDeactivate: (boxType: BoxType, trigger: HTMLButtonElement) => void
}

const DIMENSIONS_COLUMN = {
  id: 'dimensions',
  label: 'Размеры',
  alignment: 'end',
  precision: 'caller-preserved',
  unit: { kind: 'quantity', label: 'см' },
  tabularNumerals: true,
  fullValueAccess: 'visible',
} as const

const VOLUME_COLUMN = {
  id: 'volume',
  label: 'Объём',
  alignment: 'end',
  precision: 'caller-preserved',
  unit: { kind: 'quantity', label: 'см³' },
  tabularNumerals: true,
  fullValueAccess: 'visible',
} as const

function formatDimensions(bt: BoxType): string {
  const l = parseDecimal(bt.lengthCm)
  const w = parseDecimal(bt.widthCm)
  const h = parseDecimal(bt.heightCm)
  return `${l} × ${w} × ${h} см`
}

function formatVolume(volumeCm3: string): string {
  return `${parseDecimal(volumeCm3).toLocaleString('ru-RU')} см³`
}

function BoxTypeStatus({ active }: { active: boolean }) {
  return (
    <StatusBadge status={active ? 'success' : 'neutral'} label={active ? 'Активен' : 'Неактивен'} />
  )
}

function BoxTypeActions({
  boxType,
  onEdit,
  onDeactivate,
}: {
  boxType: BoxType
  onEdit: BoxTypesTableProps['onEdit']
  onDeactivate: BoxTypesTableProps['onDeactivate']
}) {
  return (
    <div className="flex min-w-0 flex-col items-stretch gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 min-w-0 w-full px-1"
        onClick={event => onEdit(boxType, event.currentTarget)}
        aria-label={`Редактировать «${boxType.name}»`}
      >
        <Pencil aria-hidden="true" className="size-4" />
        Редактировать
      </Button>
      {boxType.isActive && (
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 min-w-0 w-full px-1 text-destructive hover:text-destructive"
          onClick={event => onDeactivate(boxType, event.currentTarget)}
          aria-label={`Деактивировать «${boxType.name}»`}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Деактивировать
        </Button>
      )}
    </div>
  )
}

function BoxTypeCards({ boxTypes, onEdit, onDeactivate }: BoxTypesTableProps) {
  return (
    <div className="space-y-3">
      {boxTypes.map(boxType => (
        <Card key={boxType.id}>
          <CardContent className="space-y-4 p-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h3 className="break-words font-medium">{boxType.name}</h3>
              <BoxTypeStatus active={boxType.isActive} />
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Размеры</dt>
              <dd className="break-words text-right tabular-nums">{formatDimensions(boxType)}</dd>
              <dt className="text-muted-foreground">Объём</dt>
              <dd className="break-words text-right tabular-nums">
                {formatVolume(boxType.volumeCm3)}
              </dd>
            </dl>
            <BoxTypeActions boxType={boxType} onEdit={onEdit} onDeactivate={onDeactivate} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function BoxTypesTable({ boxTypes, onEdit, onDeactivate }: BoxTypesTableProps) {
  const contract: TableConsumerContract = {
    primaryColumn: { id: 'name', label: 'Название' },
    numericColumns: [DIMENSIONS_COLUMN, VOLUME_COLUMN],
    sorting: { kind: 'none' },
    selection: { kind: 'none' },
    rowActions: {
      kind: 'caller-rendered',
      accessibleNamePattern: 'Действия для типа коробки {entityId}',
    },
    narrowStrategy: {
      kind: 'stacked-detail',
      description: 'Карточки типов коробок для узкого экрана',
      narrowContent: (
        <BoxTypeCards boxTypes={boxTypes} onEdit={onEdit} onDeactivate={onDeactivate} />
      ),
    },
    pagination: { kind: 'none' },
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ResponsiveTable accessibleLabel="Типы коробок" contract={contract}>
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
                <TableCell className="text-right tabular-nums">{formatDimensions(bt)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVolume(bt.volumeCm3)}
                </TableCell>
                <TableCell>
                  <BoxTypeStatus active={bt.isActive} />
                </TableCell>
                <TableCell className="text-right">
                  <BoxTypeActions boxType={bt} onEdit={onEdit} onDeactivate={onDeactivate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ResponsiveTable>
      </CardContent>
    </Card>
  )
}
