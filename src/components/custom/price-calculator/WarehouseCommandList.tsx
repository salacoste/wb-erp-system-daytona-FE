'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import type { Warehouse } from '@/types/warehouse'

interface WarehouseCommandListProps {
  popular: Warehouse[]
  other: Warehouse[]
  value: number | null
  onSelect: (warehouseId: number) => void
  onClear: () => void
}

/**
 * Warehouse dropdown list with popular/other groups
 * Extracted from WarehouseSelect for file size compliance (Story 74.8)
 */
export function WarehouseCommandList({
  popular,
  other,
  value,
  onSelect,
  onClear,
}: WarehouseCommandListProps) {
  return (
    <CommandList>
      <CommandEmpty>Склад не найден</CommandEmpty>
      {popular.length > 0 && (
        <CommandGroup heading="Популярные">
          {popular.map(wh => (
            <CommandItem key={wh.id} value={wh.id.toString()} onSelect={() => onSelect(wh.id)}>
              <Check
                className={cn('mr-2 h-4 w-4', value === wh.id ? 'opacity-100' : 'opacity-0')}
              />
              <span className="text-muted-foreground text-xs mr-2">[{wh.id}]</span>
              {wh.name}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {popular.length > 0 && other.length > 0 && <CommandSeparator />}
      {other.length > 0 && (
        <CommandGroup heading={`Все склады (${other.length})`}>
          {other.map(wh => (
            <CommandItem key={wh.id} value={wh.id.toString()} onSelect={() => onSelect(wh.id)}>
              <Check
                className={cn('mr-2 h-4 w-4', value === wh.id ? 'opacity-100' : 'opacity-0')}
              />
              <span className="text-muted-foreground text-xs mr-2">[{wh.id}]</span>
              {wh.name}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {value && (
        <>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem onSelect={onClear}>Очистить выбор</CommandItem>
          </CommandGroup>
        </>
      )}
    </CommandList>
  )
}
