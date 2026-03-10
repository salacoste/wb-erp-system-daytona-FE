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
import { filterOptions, getButtonText } from './multi-select-helpers'

/**
 * MultiSelectDropdown - Reusable multi-select filter component
 * Story 24.9-FE: Multi-select Brand & Warehouse Filters
 * Epic 24: Paid Storage Analytics (Frontend)
 */
export interface MultiSelectDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  searchThreshold?: number
  className?: string
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

  const filteredOptions = React.useMemo(
    () => filterOptions(options, searchQuery),
    [options, searchQuery]
  )

  const allSelected = selected.length === 0 || selected.length === options.length

  const handleSelectAll = () => {
    if (!allSelected) onChange([])
  }

  const handleOptionToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
    setSearchQuery('')
  }

  React.useEffect(() => {
    if (!open) setSearchQuery('')
  }, [open])

  if (loading) {
    return <Skeleton className={cn('h-10 w-40', className)} />
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
          <span className="truncate">{getButtonText(selected, label, placeholder)}</span>
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
        onCloseAutoFocus={e => e.preventDefault()}
      >
        {options.length > searchThreshold && (
          <>
            <div className="p-2">
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8"
                autoFocus
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuCheckboxItem
          checked={allSelected}
          onCheckedChange={handleSelectAll}
          className="font-medium"
        >
          {placeholder}
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <div className="max-h-[200px] overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Ничего не найдено</div>
          ) : (
            filteredOptions.map(option => (
              <DropdownMenuCheckboxItem
                key={option}
                checked={selected.includes(option)}
                onCheckedChange={() => handleOptionToggle(option)}
                onSelect={e => e.preventDefault()}
              >
                {option}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>

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
