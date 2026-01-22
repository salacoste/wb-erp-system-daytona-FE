'use client'

/**
 * WarehouseSelect Component
 * Story 44.12-FE: Warehouse Selection Dropdown
 * Story 44.34-FE: Debounce Warehouse Selection & Rate Limit Handling
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Searchable dropdown for selecting WB warehouses
 * Features: Search by name/ID, popular warehouses section, debouncing, rate limit handling
 */

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, Warehouse as WarehouseIcon, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useWarehouses } from '@/hooks/useWarehouses'
import { useAcceptanceCoefficients } from '@/hooks/useAcceptanceCoefficients'
import { filterWarehouses, separateWarehouses } from '@/lib/warehouse-utils'
import type { Warehouse } from '@/types/warehouse'

export interface WarehouseSelectProps {
  /** Selected warehouse ID */
  value: number | null
  /** Callback when warehouse selection changes */
  onChange: (warehouseId: number | null, warehouse: Warehouse | null) => void
  /** Disable the dropdown */
  disabled?: boolean
  /** Error message to display */
  error?: string
  /** Enable debouncing for coefficient fetching (default: true) */
  enableDebounce?: boolean
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number
}

export function WarehouseSelect({
  value,
  onChange,
  disabled,
  error,
  enableDebounce = true,
  debounceMs = 500,
}: WarehouseSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: warehouses, isLoading, isError, refetch } = useWarehouses()

  // Story 44.34: Fetch coefficients with debouncing and rate limit handling
  const {
    isDebouncing,
    isRateLimited,
    cooldownRemaining,
  } = useAcceptanceCoefficients(value, {
    debounceMs: enableDebounce ? debounceMs : 0,
    enabled: enableDebounce,
  })

  // Find selected warehouse
  const selectedWarehouse = useMemo(
    () => warehouses?.find((w) => w.id === value) ?? null,
    [warehouses, value],
  )

  // Filter warehouses by search query
  const filteredWarehouses = useMemo(
    () => filterWarehouses(warehouses ?? [], search),
    [warehouses, search],
  )

  // Separate popular and other warehouses
  const { popular, other } = useMemo(
    () => separateWarehouses(filteredWarehouses),
    [filteredWarehouses],
  )

  const handleSelect = (warehouseId: number) => {
    const warehouse = warehouses?.find((w) => w.id === warehouseId) ?? null
    onChange(warehouseId, warehouse)
    setOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    onChange(null, null)
    setOpen(false)
    setSearch('')
  }

  // Combined disabled state (AC4: Rate Limit Cooldown UI)
  const isDisabled = disabled || isLoading || isRateLimited

  return (
    <div className="space-y-3">
      {/* Header with label and info tooltip (AC6: User Guidance for Rate Limits) */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Склад WB</span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                Коэффициенты обновляются автоматически. Не переключайте склады слишком часто
                (лимит Wildberries API: 6 запросов/мин).
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Выберите склад"
            className={cn(
              'w-full justify-between',
              !value && 'text-muted-foreground',
              error && 'border-destructive',
              isRateLimited && 'bg-muted',
            )}
            disabled={isDisabled}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка складов...
              </span>
            ) : selectedWarehouse ? (
              <span className="flex items-center gap-2 truncate">
                <WarehouseIcon className="h-4 w-4 shrink-0" />
                {selectedWarehouse.name}
              </span>
            ) : (
              'Выберите склад...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Поиск склада..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Склад не найден</CommandEmpty>

              {/* Popular warehouses */}
              {popular.length > 0 && (
                <CommandGroup heading="Популярные">
                  {popular.map((warehouse) => (
                    <CommandItem
                      key={warehouse.id}
                      value={warehouse.id.toString()}
                      onSelect={() => handleSelect(warehouse.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === warehouse.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="text-muted-foreground text-xs mr-2">
                        [{warehouse.id}]
                      </span>
                      {warehouse.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {popular.length > 0 && other.length > 0 && <CommandSeparator />}

              {/* All other warehouses */}
              {other.length > 0 && (
                <CommandGroup heading={`Все склады (${other.length})`}>
                  {other.map((warehouse) => (
                    <CommandItem
                      key={warehouse.id}
                      value={warehouse.id.toString()}
                      onSelect={() => handleSelect(warehouse.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === warehouse.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="text-muted-foreground text-xs mr-2">
                        [{warehouse.id}]
                      </span>
                      {warehouse.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Clear selection */}
              {value && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={handleClear}>Очистить выбор</CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <span>Не удалось загрузить склады</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => refetch()}
            className="h-auto p-0"
          >
            Повторить
          </Button>
        </div>
      )}

      {/* Form validation error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Debouncing indicator (AC2: Loading State During Debounce) */}
      {isDebouncing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Загрузка коэффициентов...</span>
        </div>
      )}

      {/* Rate limited indicator (AC4: Rate Limit Cooldown UI) */}
      {isRateLimited && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
          <Info className="h-4 w-4" />
          <span>
            Лимит запросов превышен. Доступно через {cooldownRemaining} сек.
          </span>
        </div>
      )}

      {/* Count display */}
      {warehouses && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Найдено: {warehouses.length} складов
        </p>
      )}
    </div>
  )
}
