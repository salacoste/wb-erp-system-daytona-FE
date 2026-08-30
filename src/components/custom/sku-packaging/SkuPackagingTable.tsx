'use client'
import { Pencil, Trash2 } from 'lucide-react'
import { ResponsiveTable } from '@/components/product/tables'
import type { TableConsumerContract } from '@/components/product/tables/contracts'
import { StatusBadge } from '@/components/product/metrics'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { SkuPackaging } from '@/types/shipment-cost'
import { SKU_PACKAGING_COLUMNS } from './sku-packaging-columns'
interface Props {
  items: SkuPackaging[]
  onEdit: (item: SkuPackaging, trigger: HTMLButtonElement) => void
  onDelete: (item: SkuPackaging, trigger: HTMLButtonElement) => void
}
function productLabel(item: SkuPackaging) {
  const name = item.product?.subject || item.product?.vendorCode || ''
  return name ? `${item.nmId} — ${name}` : String(item.nmId || 'Неизвестный SKU')
}
function mappingState(item: SkuPackaging) {
  if (
    !item.nmId ||
    !item.boxTypeId ||
    !item.boxType?.id ||
    item.boxType.id !== item.boxTypeId ||
    (!!item.product?.nmId && item.product.nmId !== item.nmId)
  )
    return { status: 'warning' as const, label: 'Требует проверки' }
  if (!item.boxType.name || item.unitsPerBox <= 0 || !item.product?.nmId)
    return { status: 'warning' as const, label: 'Неполные данные' }
  if (!item.boxType.isActive) return { status: 'neutral' as const, label: 'Тип коробки неактивен' }
  return { status: 'success' as const, label: 'Привязка активна' }
}
function MappingStatus({ item }: { item: SkuPackaging }) {
  const state = mappingState(item)
  return <StatusBadge status={state.status} label={state.label} />
}
function Actions({
  item,
  onEdit,
  onDelete,
}: { item: SkuPackaging } & Pick<Props, 'onEdit' | 'onDelete'>) {
  return (
    <div className="flex min-w-0 flex-col items-stretch gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 w-full min-w-0 px-1"
        onClick={event => onEdit(item, event.currentTarget)}
        aria-label={`Редактировать упаковку SKU ${item.nmId}`}
      >
        <Pencil aria-hidden="true" className="size-4" />
        Редактировать
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 w-full min-w-0 px-1 text-destructive hover:text-destructive"
        onClick={event => onDelete(item, event.currentTarget)}
        aria-label={`Удалить упаковку SKU ${item.nmId}`}
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Удалить
      </Button>
    </div>
  )
}
function NarrowCards(props: Props) {
  return (
    <div className="space-y-3">
      {props.items.map(item => (
        <Card key={item.nmId}>
          <CardContent className="space-y-4 p-4">
            <div className="flex min-w-0 flex-col gap-2">
              <h3 className="break-words font-medium">{productLabel(item)}</h3>
              <MappingStatus item={item} />
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Тип коробки</dt>
              <dd className="break-words text-right">{item.boxType?.name || 'Не указан'}</dd>
              <dt className="text-muted-foreground">В одной коробке</dt>
              <dd className="text-right tabular-nums">{item.unitsPerBox} шт.</dd>
            </dl>
            <Actions item={item} onEdit={props.onEdit} onDelete={props.onDelete} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
export function SkuPackagingTable(props: Props) {
  const contract: TableConsumerContract = {
    primaryColumn: { id: 'product', label: 'SKU и товар' },
    numericColumns: [
      {
        id: 'unitsPerBox',
        label: 'Штук в коробке',
        alignment: 'end',
        precision: 'integer',
        unit: { kind: 'count', label: 'шт.' },
        tabularNumerals: true,
        fullValueAccess: 'visible',
      },
    ],
    sorting: { kind: 'none' },
    selection: { kind: 'none' },
    rowActions: {
      kind: 'caller-rendered',
      accessibleNamePattern: 'Действия для упаковки SKU {entityId}',
    },
    narrowStrategy: {
      kind: 'stacked-detail',
      description: 'Карточки привязок упаковки для узкого экрана',
      narrowContent: <NarrowCards {...props} />,
    },
    pagination: { kind: 'none' },
  }
  return (
    <Card>
      <CardContent className="p-0">
        <ResponsiveTable accessibleLabel="Привязки упаковки SKU" contract={contract}>
          <TableHeader>
            <TableRow>
              {SKU_PACKAGING_COLUMNS.map(column => (
                <TableHead
                  key={column.key}
                  className={column.align === 'right' ? 'text-right' : ''}
                >
                  {column.srOnly ? <span className="sr-only">{column.label}</span> : column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.items.map(item => (
              <TableRow key={item.nmId}>
                <TableCell className="font-medium">{productLabel(item)}</TableCell>
                <TableCell>{item.boxType?.name || 'Не указан'}</TableCell>
                <TableCell className="text-right tabular-nums">{item.unitsPerBox} шт.</TableCell>
                <TableCell>
                  <MappingStatus item={item} />
                </TableCell>
                <TableCell className="text-right">
                  <Actions item={item} onEdit={props.onEdit} onDelete={props.onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ResponsiveTable>
      </CardContent>
    </Card>
  )
}
