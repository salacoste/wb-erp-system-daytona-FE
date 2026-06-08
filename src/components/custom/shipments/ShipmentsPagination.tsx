/**
 * Shipments table pagination controls + StatusBadge
 * Extracted from ShipmentsTable.tsx for file size compliance
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShipmentStatus } from '@/types/shipment-cost'
import { STATUS_LABELS } from './shipments-columns'

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <Badge variant={status === ShipmentStatus.CONFIRMED ? 'default' : 'outline'}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

interface ShipmentsPaginationProps {
  page: number
  totalPages: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function ShipmentsPagination({
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
}: ShipmentsPaginationProps) {
  return (
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
  )
}
