'use client'

/**
 * OrderPickerFilters Component
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Search and status filter controls for order picker.
 */

import { useEffect, useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { EligibleSupplierStatus } from '@/hooks/useOrdersForSupply'

// =============================================================================
// Constants
// =============================================================================

const STATUS_OPTIONS: { value: EligibleSupplierStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'confirm', label: 'Подтвержден' },
  { value: 'complete', label: 'Завершен' },
]

const SEARCH_DEBOUNCE_MS = 300

// =============================================================================
// Types
// =============================================================================

interface OrderPickerFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  statusFilter: EligibleSupplierStatus | null
  onStatusChange: (status: EligibleSupplierStatus | null) => void
  onClearFilters: () => void
  activeFilterCount: number
  disabled?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function OrderPickerFilters({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
  activeFilterCount,
  disabled = false,
}: OrderPickerFiltersProps) {
  // Local state for debounced search
  const [localSearch, setLocalSearch] = useState(searchValue)

  // Sync local search with prop when prop changes externally
  useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  // Debounced search
  useEffect(() => {
    // Clear immediately when search is cleared
    if (!localSearch.trim()) {
      if (searchValue) {
        onSearchChange('')
      }
      return
    }

    const timer = setTimeout(() => {
      onSearchChange(localSearch.trim())
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange, searchValue])

  const handleSearchClear = () => {
    setLocalSearch('')
    onSearchChange('')
  }

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      onStatusChange(null)
    } else {
      onStatusChange(value as EligibleSupplierStatus)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end" role="search">
      {/* Search Input */}
      <div className="flex-1">
        <Label htmlFor="order-search" className="sr-only">
          Поиск заказов
        </Label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            id="order-search"
            type="text"
            placeholder="Поиск по ID или артикулу..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="pl-9 pr-9"
            disabled={disabled}
            aria-label="Поиск по ID или артикулу"
          />
          {localSearch && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSearchClear}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              aria-label="Очистить поиск"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="w-full sm:w-[160px]">
        <Label htmlFor="status-filter" className="sr-only">
          Фильтр по статусу
        </Label>
        <Select
          value={statusFilter || 'all'}
          onValueChange={handleStatusChange}
          disabled={disabled}
        >
          <SelectTrigger id="status-filter" aria-label="Статус">
            <Filter className="mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {activeFilterCount > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="whitespace-nowrap"
          disabled={disabled}
        >
          Очистить ({activeFilterCount})
        </Button>
      )}
    </div>
  )
}
