/** Shipment queue pagination controls. */

'use client'

import { TablePagination } from '@/components/product/tables'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ShipmentsPaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function ShipmentsPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: ShipmentsPaginationProps) {
  const firstResult = total === 0 ? 0 : (page - 1) * limit + 1
  const lastResult = Math.min(page * limit, total)

  return (
    <TablePagination
      kind="offset"
      label="Навигация по страницам отправок"
      currentPage={totalPages === 0 ? 0 : page}
      totalPages={totalPages}
      resultScope={`Показано ${firstResult}–${lastResult} из ${total}`}
      onPageChange={onPageChange}
      pageSize={
        <Select value={String(limit)} onValueChange={v => onLimitChange(Number(v))}>
          <SelectTrigger className="min-h-11 w-[8.5rem]" aria-label="Строк на странице">
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
      }
    />
  )
}
