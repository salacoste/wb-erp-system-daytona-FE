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
import { Check, ChevronsUpDown, Warehouse as WarehouseIcon, Loader2, Info, Truck, Package } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
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
}: WarehouseSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: warehouses, isLoading, isError, refetch } = useWarehouses()

  // Story 44.34: Debouncing and rate limit state removed - now handled by useWarehouseCoefficients
  // via /all endpoint which doesn't require per-warehouse calls
  const isDebouncing = false
  const isRateLimited = false
  const cooldownRemaining = 0

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
      {warehouses && !isLoading && !selectedWarehouse && (
        <p className="text-xs text-muted-foreground">
          Найдено: {warehouses.length} складов
        </p>
      )}

      {/* Selected warehouse tariffs display */}
      {selectedWarehouse && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Truck className="h-3.5 w-3.5" />
            <span>Логистика:</span>
            <span className="text-foreground">
              {formatCurrency(selectedWarehouse.tariffs.deliveryBaseLiterRub)} (1л) + {formatCurrency(selectedWarehouse.tariffs.deliveryPerLiterRub)}/л
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Package className="h-3.5 w-3.5" />
            <span>Хранение:</span>
            <span className="text-foreground">
              {selectedWarehouse.tariffs.storageBaseLiterRub.toFixed(2)} ₽/день (1л) + {selectedWarehouse.tariffs.storagePerLiterRub.toFixed(2)} ₽/л/день
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
