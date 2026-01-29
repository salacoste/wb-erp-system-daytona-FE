/**
 * OrdersFilters Component
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Filter controls for orders: date range, status filters, search.
 * Reference: docs/stories/epic-40/story-40.3-fe-orders-list-page.md#AC3
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
import { X, Search } from 'lucide-react'
import type { SupplierStatus, WbStatus } from '@/types/orders'

interface OrdersFiltersProps {
  /** Start date (ISO string) */
  dateFrom: string
  /** End date (ISO string) */
  dateTo: string
  /** Supplier status filter */
  supplierStatus: SupplierStatus | null
  /** WB status filter */
  wbStatus: WbStatus | null
  /** Search input value (nmId) */
  searchValue: string
  /** Date from change handler */
  onDateFromChange: (value: string) => void
  /** Date to change handler */
  onDateToChange: (value: string) => void
  /** Supplier status change handler */
  onSupplierStatusChange: (value: SupplierStatus | null) => void
  /** WB status change handler */
  onWbStatusChange: (value: WbStatus | null) => void
  /** Search input change handler */
  onSearchChange: (value: string) => void
  /** Clear all filters */
  onClearFilters: () => void
  /** Whether any filter is active */
  hasActiveFilters?: boolean
}

/** Supplier status options for dropdown */
const SUPPLIER_STATUS_OPTIONS: Array<{ value: SupplierStatus; label: string }> = [
  { value: 'new', label: 'Новый' },
  { value: 'confirm', label: 'Подтверждён' },
  { value: 'complete', label: 'Выполнен' },
  { value: 'cancel', label: 'Отменён' },
]

/** WB status options for dropdown */
const WB_STATUS_OPTIONS: Array<{ value: WbStatus; label: string }> = [
  { value: 'waiting', label: 'Ожидает' },
  { value: 'sorted', label: 'Отсортирован' },
  { value: 'sold', label: 'Продан' },
  { value: 'canceled', label: 'Отменён' },
]

/**
 * OrdersFilters - Filter controls for orders list
 */
export function OrdersFilters({
  dateFrom,
  dateTo,
  supplierStatus,
  wbStatus,
  searchValue,
  onDateFromChange,
  onDateToChange,
  onSupplierStatusChange,
  onWbStatusChange,
  onSearchChange,
  onClearFilters,
  hasActiveFilters = false,
}: OrdersFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Date range and status filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date from */}
        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="text-sm text-muted-foreground whitespace-nowrap">
            С:
          </label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={e => onDateFromChange(e.target.value)}
            className="w-36"
          />
        </div>

        {/* Date to */}
        <div className="flex items-center gap-2">
          <label htmlFor="date-to" className="text-sm text-muted-foreground whitespace-nowrap">
            По:
          </label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={e => onDateToChange(e.target.value)}
            className="w-36"
          />
        </div>

        {/* Supplier status */}
        <Select
          value={supplierStatus ?? 'all'}
          onValueChange={v => onSupplierStatusChange(v === 'all' ? null : (v as SupplierStatus))}
        >
          <SelectTrigger className="w-40" aria-label="Статус продавца">
            <SelectValue placeholder="Статус продавца" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {SUPPLIER_STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* WB status */}
        <Select
          value={wbStatus ?? 'all'}
          onValueChange={v => onWbStatusChange(v === 'all' ? null : (v as WbStatus))}
        >
          <SelectTrigger className="w-40" aria-label="Статус WB">
            <SelectValue placeholder="Статус WB" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы WB</SelectItem>
            {WB_STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Сбросить
          </Button>
        )}
      </div>

      {/* Search input */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Поиск по SKU (nmId)"
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
          aria-label="Поиск по SKU"
        />
      </div>
    </div>
  )
}
