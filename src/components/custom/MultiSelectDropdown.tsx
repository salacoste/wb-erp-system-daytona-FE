'use client'

import * as React from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * MultiSelectDropdown - Reusable multi-select filter component
 * Story 24.9-FE: Multi-select Brand & Warehouse Filters
 * Epic 24: Paid Storage Analytics (Frontend)
 */
export interface MultiSelectDropdownProps {
  /** Label for the dropdown button */
  label: string
  /** Available options to select from */
  options: string[]
  /** Currently selected options */
  selected: string[]
  /** Callback when selection changes */
  onChange: (selected: string[]) => void
  /** Placeholder when nothing selected */
  placeholder?: string
  /** Loading state */
  loading?: boolean
  /** Disable the dropdown */
  disabled?: boolean
  /** Show search input when more than this many options (default: 10) */
  searchThreshold?: number
  /** Custom width class */
  className?: string
  /** Aria label for accessibility */
  'aria-label'?: string
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Все',
  loading = false,
  disabled = false,
  searchThreshold = 10,
  className,
  'aria-label': ariaLabel,
}: MultiSelectDropdownProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [open, setOpen] = React.useState(false)

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase()
    return options.filter((option) => option.toLowerCase().includes(query))
  }, [options, searchQuery])

  // Check if all options are selected
  const allSelected = selected.length === 0 || selected.length === options.length

  // Handle "Select All" toggle
  const handleSelectAll = () => {
    if (allSelected) {
      // Already all selected, do nothing
      return
    }
    onChange([])
  }

  // Handle individual option toggle
  const handleOptionToggle = (option: string) => {
    if (selected.includes(option)) {
      // Remove from selection
      const newSelected = selected.filter((s) => s !== option)
      onChange(newSelected)
    } else {
      // Add to selection
      onChange([...selected, option])
    }
  }

  // Clear all selections
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
    setSearchQuery('')
  }

  // Get button text based on selection
  const getButtonText = (): string => {
    if (selected.length === 0) {
      return placeholder
    }
    if (selected.length === 1) {
      return selected[0]
    }
    return `${label} (${selected.length})`
  }

  // Reset search when dropdown closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  if (loading) {
    return (
      <Skeleton className={cn('h-10 w-40', className)} />
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel || label}
          className={cn(
            'w-40 justify-between font-normal',
            selected.length > 0 && 'border-primary',
            className
          )}
        >
          <span className="truncate">{getButtonText()}</span>
          <div className="flex items-center gap-1">
            {selected.length > 0 && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
                aria-label="Очистить"
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 max-h-[300px]"
        align="start"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Search input for large lists */}
        {options.length > searchThreshold && (
          <>
            <div className="p-2">
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
                autoFocus
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Select All option */}
        <DropdownMenuCheckboxItem
          checked={allSelected}
          onCheckedChange={handleSelectAll}
          className="font-medium"
        >
          {placeholder}
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        {/* Filtered options */}
        <div className="max-h-[200px] overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          ) : (
            filteredOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option}
                checked={selected.includes(option)}
                onCheckedChange={() => handleOptionToggle(option)}
                onSelect={(e) => e.preventDefault()}
              >
                {option}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>

        {/* Selected count footer */}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Выбрано: {selected.length} из {options.length}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
