'use client'

/**
 * WarehouseSelect Component
 * Story 44.12-FE: Warehouse Selection Dropdown
 * Story 44.40-FE: Two Tariff Systems Integration
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ChevronsUpDown,
  Warehouse as WarehouseIcon,
  Loader2,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandInput } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { logger } from '@/lib/logger'
import { filterWarehouses, separateWarehouses } from '@/lib/warehouse-utils'
import { WarehouseTariffsByBoxType } from './WarehouseTariffsByBoxType'
import { WarehouseCommandList } from './WarehouseCommandList'
import { useWarehouseSelectData } from './useWarehouseSelectData'
import type { Warehouse } from '@/types/warehouse'

export interface WarehouseSelectProps {
  value: number | null
  onChange: (warehouseId: number | null, warehouse: Warehouse | null) => void
  onSetWarehouseById?: (id: number, warehouses: Warehouse[]) => void
  disabled?: boolean
  error?: string
  deliveryDate?: string | null
  useSupplySource?: boolean
}

export function WarehouseSelect({
  value,
  onChange,
  onSetWarehouseById,
  disabled,
  error,
  deliveryDate,
  useSupplySource = false,
}: WarehouseSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const presetRestoredRef = useRef(false)

  const { warehouses, isLoading, isError, refetch, supplyQuery } =
    useWarehouseSelectData(useSupplySource)

  // Story 44.44: Restore warehouse from preset when data loads
  useEffect(() => {
    if (presetRestoredRef.current || !value || !warehouses?.length) return
    const warehouse = warehouses.find(w => w.id === value)
    if (warehouse) {
      presetRestoredRef.current = true
      logger.debug('[WarehouseSelect] Restoring warehouse from preset:', {
        id: value,
        name: warehouse.name,
      })
      onChange(value, warehouse)
      onSetWarehouseById?.(value, warehouses)
    }
  }, [value, warehouses, onChange, onSetWarehouseById])

  const selectedWarehouse = useMemo(
    () => warehouses?.find(w => w.id === value) ?? null,
    [warehouses, value]
  )
  const filteredWarehouses = useMemo(
    () => filterWarehouses(warehouses ?? [], search),
    [warehouses, search]
  )
  const { popular, other } = useMemo(
    () => separateWarehouses(filteredWarehouses),
    [filteredWarehouses]
  )

  const handleSelect = (warehouseId: number) => {
    onChange(warehouseId, warehouses?.find(w => w.id === warehouseId) ?? null)
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
            className={cn(
              'w-full justify-between',
              !value && 'text-muted-foreground',
              error && 'border-destructive'
            )}
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
            <WarehouseCommandList
              popular={popular}
              other={other}
              value={value}
              onSelect={handleSelect}
              onClear={handleClear}
            />
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
      {selectedWarehouse?.tariffs.usingStorageFallback && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Backend вернул нулевой тариф хранения для этого склада; расчет использует тариф по
            умолчанию до обновления справочника.
          </span>
        </div>
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
