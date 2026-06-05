/**
 * Reorder status filter — tabs / select for all/pending/ordered/received/expired.
 */

'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ReorderStatusFilter } from '@/types/reorder-recommendations'

const STATUS_OPTIONS: { value: ReorderStatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'Ожидают' },
  { value: 'ordered', label: 'Заказано' },
  { value: 'received', label: 'Получено' },
  { value: 'expired', label: 'Просрочено' },
]

interface ReorderFiltersProps {
  value: ReorderStatusFilter
  onChange: (value: ReorderStatusFilter) => void
}

export function ReorderFilters({ value, onChange }: ReorderFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Статус:</span>
      <Select value={value} onValueChange={v => onChange(v as ReorderStatusFilter)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
