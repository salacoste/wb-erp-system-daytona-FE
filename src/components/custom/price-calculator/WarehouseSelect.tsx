'use client'

/**
 * WarehouseSelect Component
 * Story 44.12-FE: Warehouse Selection Dropdown
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Searchable dropdown for selecting WB warehouses from SUPPLY system
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
import { useSupplyTariffs, type SupplyWarehouse } from '@/hooks/useSupplyTariffs'
import { filterWarehouses, separateWarehouses } from '@/lib/warehouse-utils'
import { WarehouseTariffsByBoxType } from './WarehouseTariffsByBoxType'
import type { Warehouse } from '@/types/warehouse'

export interface WarehouseSelectProps {
  value: number | null
  onChange: (warehouseId: number | null, warehouse: Warehouse | null) => void
  disabled?: boolean
  error?: string
  deliveryDate?: string | null
  /** Use SUPPLY warehouses instead of INVENTORY (default: false) */
  useSupplySource?: boolean
}

export function WarehouseSelect({
  value,
  onChange,
  disabled,
  error,
  deliveryDate,
  useSupplySource = false,
}: WarehouseSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Fetch from both sources
  const inventoryQuery = useWarehouses()
  const supplyQuery = useSupplyTariffs()

  // Convert SupplyWarehouse[] to Warehouse[] with tariffs from SUPPLY coefficients
  const supplyWarehouses = useMemo((): Warehouse[] => {
    return supplyQuery.warehouses.map((sw: SupplyWarehouse) => ({
      id: sw.id,
      name: sw.name,
      tariffs: {
        deliveryBaseLiterRub: sw.tariffs.deliveryBaseLiterRub,
        deliveryPerLiterRub: sw.tariffs.deliveryPerLiterRub,
        storageBaseLiterRub: sw.tariffs.storageBaseLiterRub,
        storagePerLiterRub: sw.tariffs.storagePerLiterRub,
        logisticsCoefficient: sw.tariffs.logisticsCoefficient,
        storageCoefficient: sw.tariffs.storageCoefficient,
      },
    }))
  }, [supplyQuery.warehouses])

  // Use SUPPLY or INVENTORY based on prop
  const warehouses = useSupplySource ? supplyWarehouses : inventoryQuery.data
  const isLoading = useSupplySource ? supplyQuery.isLoading : inventoryQuery.isLoading
  const isError = useSupplySource ? !!supplyQuery.error : inventoryQuery.isError
  const refetch = useSupplySource ? () => {} : inventoryQuery.refetch

  const selectedWarehouse = useMemo(
    () => warehouses?.find((w) => w.id === value) ?? null,
    [warehouses, value],
  )

  const filteredWarehouses = useMemo(
    () => filterWarehouses(warehouses ?? [], search),
    [warehouses, search],
  )

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

  return (
    <div className="space-y-3">
      {/* Header with label and tooltip */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Склад WB</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">Выберите склад для расчета тарифов логистики и хранения.</p>
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
            className={cn('w-full justify-between', !value && 'text-muted-foreground', error && 'border-destructive')}
            disabled={disabled || isLoading}
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
            <CommandInput placeholder="Поиск склада..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>Склад не найден</CommandEmpty>

              {popular.length > 0 && (
                <CommandGroup heading="Популярные">
                  {popular.map((warehouse) => (
                    <CommandItem key={warehouse.id} value={warehouse.id.toString()} onSelect={() => handleSelect(warehouse.id)}>
                      <Check className={cn('mr-2 h-4 w-4', value === warehouse.id ? 'opacity-100' : 'opacity-0')} />
                      <span className="text-muted-foreground text-xs mr-2">[{warehouse.id}]</span>
                      {warehouse.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {popular.length > 0 && other.length > 0 && <CommandSeparator />}

              {other.length > 0 && (
                <CommandGroup heading={`Все склады (${other.length})`}>
                  {other.map((warehouse) => (
                    <CommandItem key={warehouse.id} value={warehouse.id.toString()} onSelect={() => handleSelect(warehouse.id)}>
                      <Check className={cn('mr-2 h-4 w-4', value === warehouse.id ? 'opacity-100' : 'opacity-0')} />
                      <span className="text-muted-foreground text-xs mr-2">[{warehouse.id}]</span>
                      {warehouse.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

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

      {isError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <span>Не удалось загрузить склады</span>
          <Button variant="link" size="sm" onClick={() => refetch()} className="h-auto p-0">
            Повторить
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {warehouses && !isLoading && !selectedWarehouse && (
        <p className="text-xs text-muted-foreground">Найдено: {warehouses.length} складов</p>
      )}

      {selectedWarehouse && (
        <WarehouseTariffsByBoxType
          tariffsByBoxType={supplyQuery.getTariffsByBoxType(selectedWarehouse.id)}
          deliveryDate={deliveryDate}
        />
      )}
    </div>
  )
}
