'use client'

import { ArrowDown, ArrowUp, Eye } from 'lucide-react'
import Link from 'next/link'

import {
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableNumericCell,
  ResponsiveTableSortButton,
  TableState,
  type TableConsumerContract,
} from '@/components/product/tables'
import { Button } from '@/components/ui/button'
import { TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { buildShipmentDetailRoute } from '@/lib/routes'
import { formatDate } from '@/lib/utils'
import { ShipmentStatus, type Shipment } from '@/types/shipment-cost'

import { ShipmentStatusBadge } from './ShipmentStatusBadge'
import { shipmentIdentity, ShipmentQueueCards } from './ShipmentQueueCards'
import { ShipmentsFilterToolbar } from './ShipmentsFilterToolbar'
import { ShipmentsPagination } from './ShipmentsPagination'
import { DELIVERY_MODE_LABELS, SHIPMENTS_COLUMNS, STATUS_LABELS } from './shipments-columns'

export type SortOrder = 'asc' | 'desc'

interface ShipmentsTableProps {
  shipments: Shipment[]
  total: number
  page: number
  limit: number
  statusFilter: ShipmentStatus | undefined
  sortOrder: SortOrder
  busy?: boolean
  onStatusChange: (status: ShipmentStatus | undefined) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onSortToggle: () => void
}

const PALLETS_CONTRACT = {
  id: 'pallets',
  label: 'Паллет',
  alignment: 'end',
  precision: 'integer',
  unit: { kind: 'count', label: 'паллет' },
  tabularNumerals: true,
  fullValueAccess: 'visible',
} as const

export function ShipmentsTable({
  shipments,
  total,
  page,
  limit,
  statusFilter,
  sortOrder,
  busy = false,
  onStatusChange,
  onPageChange,
  onLimitChange,
  onSortToggle,
}: ShipmentsTableProps) {
  const totalPages = Math.ceil(total / limit)
  const SortIcon = sortOrder === 'asc' ? ArrowUp : ArrowDown
  const appliedStatusLabel = statusFilter ? STATUS_LABELS[statusFilter] : undefined
  const sorting = {
    kind: 'caller-controlled',
    activeColumnId: 'createdAt',
    direction: sortOrder === 'asc' ? 'ascending' : 'descending',
  } as const
  const contract: TableConsumerContract = {
    primaryColumn: { id: 'name', label: 'Название' },
    numericColumns: [PALLETS_CONTRACT],
    sorting,
    selection: { kind: 'none' },
    rowActions: {
      kind: 'caller-rendered',
      accessibleNamePattern: 'Открыть отправку {entityId}',
    },
    narrowStrategy: {
      kind: 'stacked-detail',
      description: 'Карточки отправок: название, статус, дата и основное действие',
      narrowContent: <ShipmentQueueCards shipments={shipments} />,
    },
    pagination: { kind: 'offset' },
  }

  const filterToolbar = (
    <ShipmentsFilterToolbar
      statusFilter={statusFilter}
      empty={shipments.length === 0}
      busy={busy}
      total={total}
      onStatusChange={onStatusChange}
    />
  )

  if (shipments.length === 0) {
    return (
      <div className="space-y-4">
        {filterToolbar}
        <TableState
          state="filtered-empty"
          message="Нет отправок по выбранному статусу."
          scope={`Применён фильтр: ${appliedStatusLabel ?? 'неизвестный статус'}.`}
          resetAction={
            <Button type="button" variant="outline" onClick={() => onStatusChange(undefined)}>
              Показать все отправки
            </Button>
          }
        />
      </div>
    )
  }

  const table = (
    <ResponsiveTable
      accessibleLabel="Очередь отправок"
      contract={contract}
      busy={busy}
      toolbar={filterToolbar}
      pagination={
        <ShipmentsPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      }
    >
      <TableHeader>
        <TableRow>
          {SHIPMENTS_COLUMNS.map(column => (
            <ResponsiveTableHeader
              key={column.key}
              columnId={column.key}
              sorting={sorting}
              className={column.align === 'right' ? 'text-right' : undefined}
            >
              {column.key === 'createdAt' ? (
                <ResponsiveTableSortButton
                  entityLabel="отправки по дате создания"
                  onClick={onSortToggle}
                  className="inline-flex items-center gap-1 text-left"
                  aria-label={`Сортировать по дате ${sortOrder === 'desc' ? 'по возрастанию' : 'по убыванию'}`}
                >
                  {column.label}
                  <SortIcon aria-hidden="true" className="size-4" />
                </ResponsiveTableSortButton>
              ) : (
                column.label
              )}
            </ResponsiveTableHeader>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {shipments.map(shipment => {
          const identity = shipmentIdentity(shipment)

          return (
            <TableRow key={shipment.id}>
              <TableCell className="font-medium">
                <span className="break-words">{identity}</span>
                {!shipment.name?.trim() && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    Название не указано
                  </span>
                )}
              </TableCell>
              <TableCell>
                <ShipmentStatusBadge status={shipment.status} />
              </TableCell>
              <TableCell>{DELIVERY_MODE_LABELS[shipment.deliveryMode] ?? 'Не указан'}</TableCell>
              <ResponsiveTableNumericCell
                contract={PALLETS_CONTRACT}
                fullValue={`${shipment.pallets.length} паллет`}
              >
                {shipment.pallets.length}
              </ResponsiveTableNumericCell>
              <TableCell>{formatDate(shipment.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={buildShipmentDetailRoute(shipment.id)}
                    aria-label={`Открыть отправку «${identity}»`}
                  >
                    <Eye aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </ResponsiveTable>
  )

  return busy ? (
    <TableState state="updating" message="Обновляем очередь отправок, текущие данные доступны.">
      {table}
    </TableState>
  ) : (
    table
  )
}
