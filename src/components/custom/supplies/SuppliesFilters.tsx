/**
 * SuppliesFilters Component
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Filter controls for supplies: status dropdown and date range.
 * Reference: docs/stories/epic-53/story-53.2-fe-supplies-list-page.md#AC3
 */

'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import type { SupplyStatus } from '@/types/supplies'

/** Status filter options with Russian labels */
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'OPEN', label: 'Открыта' },
  { value: 'CLOSED', label: 'Закрыта' },
  { value: 'DELIVERING', label: 'В пути' },
  { value: 'DELIVERED', label: 'Доставлена' },
  { value: 'CANCELLED', label: 'Отменена' },
]

export interface SuppliesFiltersProps {
  /** Current status filter */
  status: SupplyStatus | undefined
  /** Start date (ISO string) */
  dateFrom: string
  /** End date (ISO string) */
  dateTo: string
  /** Status change handler */
  onStatusChange: (status: SupplyStatus | undefined) => void
  /** Date from change handler */
  onDateFromChange: (date: string) => void
  /** Date to change handler */
  onDateToChange: (date: string) => void
  /** Clear all filters */
  onClearFilters: () => void
  /** Whether any filter is active */
  hasActiveFilters?: boolean
}

/**
 * SuppliesFilters - Filter controls for supplies list
 */
export function SuppliesFilters({
  status,
  dateFrom,
  dateTo,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  hasActiveFilters = false,
}: SuppliesFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm text-muted-foreground whitespace-nowrap">
          Статус:
        </label>
        <Select
          value={status ?? 'all'}
          onValueChange={v => onStatusChange(v === 'all' ? undefined : (v as SupplyStatus))}
        >
          <SelectTrigger id="status-filter" className="w-36" aria-label="Фильтр по статусу">
            <SelectValue placeholder="Все" />
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

      {/* Date range */}
      <div className="flex items-center gap-2">
        <label htmlFor="date-from" className="text-sm text-muted-foreground whitespace-nowrap">
          Период:
        </label>
        <Input
          id="date-from"
          type="date"
          value={dateFrom}
          onChange={e => onDateFromChange(e.target.value)}
          className="w-36"
          aria-label="Дата начала"
        />
        <span className="text-sm text-muted-foreground">—</span>
        <Input
          id="date-to"
          type="date"
          value={dateTo}
          onChange={e => onDateToChange(e.target.value)}
          className="w-36"
          aria-label="Дата окончания"
        />
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-1"
          aria-label="Очистить все фильтры"
        >
          <X className="h-4 w-4" />
          Очистить фильтры
        </Button>
      )}
    </div>
  )
}

export default SuppliesFilters
