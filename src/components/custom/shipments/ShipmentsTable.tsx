'use client'

/**
 * DataTable for Shipments listing with pagination, status filter, and date sort
 * Epic 76-FE, Story 76.1 (AC: #2, #3, #4, #5)
 */

import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowDown, ArrowUp, Eye } from 'lucide-react'
import Link from 'next/link'
import { buildShipmentDetailRoute } from '@/lib/routes'
import { formatDate } from '@/lib/utils'
import { ShipmentStatus, type Shipment } from '@/types/shipment-cost'
import {
  SHIPMENTS_COLUMNS,
  STATUS_LABELS,
  DELIVERY_MODE_LABELS,
  STATUS_FILTER_OPTIONS,
} from './shipments-columns'

export type SortOrder = 'asc' | 'desc'

interface ShipmentsTableProps {
  shipments: Shipment[]
  total: number
  page: number
  limit: number
  statusFilter: ShipmentStatus | undefined
  sortOrder: SortOrder
  onStatusChange: (status: ShipmentStatus | undefined) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onSortToggle: () => void
}

function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <Badge variant={status === ShipmentStatus.CONFIRMED ? 'default' : 'outline'}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function ShipmentsTable({
  shipments,
  total,
  page,
  limit,
  statusFilter,
  sortOrder,
  onStatusChange,
  onPageChange,
  onLimitChange,
  onSortToggle,
}: ShipmentsTableProps) {
  const totalPages = Math.ceil(total / limit)
  const SortIcon = sortOrder === 'asc' ? ArrowUp : ArrowDown

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={statusFilter ?? 'ALL'}
          onValueChange={v => onStatusChange(v === 'ALL' ? undefined : (v as ShipmentStatus))}
        >
          <SelectTrigger className="w-[180px]" aria-label="Фильтр по статусу">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">Найдено: {total}</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {SHIPMENTS_COLUMNS.map(col => (
                  <TableHead key={col.key} className={col.align === 'right' ? 'text-right' : ''}>
                    {col.key === 'createdAt' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={onSortToggle}
                        aria-label={`Сортировать по дате ${sortOrder === 'desc' ? 'по возрастанию' : 'по убыванию'}`}
                      >
                        {col.label}
                        <SortIcon className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      col.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={SHIPMENTS_COLUMNS.length} className="h-24 text-center">
                    Нет отправок по фильтру
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell>{DELIVERY_MODE_LABELS[s.deliveryMode]}</TableCell>
                    <TableCell className="text-right">{s.pallets.length}</TableCell>
                    <TableCell>{formatDate(s.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild aria-label="Открыть отправку">
                        <Link href={buildShipmentDetailRoute(s.id)}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Select value={String(limit)} onValueChange={v => onLimitChange(Number(v))}>
          <SelectTrigger className="w-[100px]" aria-label="Строк на странице">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map(n => (
              <SelectItem key={n} value={String(n)}>
                {n} строк
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Вперёд
          </Button>
        </div>
      </div>
    </div>
  )
}
