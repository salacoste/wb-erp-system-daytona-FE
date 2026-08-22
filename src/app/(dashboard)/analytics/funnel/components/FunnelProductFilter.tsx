/** Funnel Product Filter — Story 73.4-FE: multi-select combobox for nmIds */
'use client'

import { useState, useMemo } from 'react'
import { useFunnelData } from '@/hooks/use-funnel-analytics'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FunnelProductItem } from '@/types/analytics-funnel'

interface FunnelProductFilterProps {
  from: string
  to: string
  value: number[]
  onChange: (nmIds: number[]) => void
}

interface ProductOption {
  nmId: number
  label: string
  brand: string
}

export function FunnelProductFilter({ from, to, value, onChange }: FunnelProductFilterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, refetch } = useFunnelData(from, to, { limit: 500 })

  const products: ProductOption[] = useMemo(() => {
    const items = (data?.items ?? []) as FunnelProductItem[]
    return items.map(i => ({
      nmId: i.nmId,
      label: i.vendorCode ?? `nmId: ${i.nmId}`,
      brand: i.brandName ?? '',
    }))
  }, [data])

  const selectedSet = useMemo(() => new Set(value), [value])

  const filtered = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter(
      p =>
        p.label.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        String(p.nmId).includes(q)
    )
  }, [products, search])

  const toggleProduct = (nmId: number) => {
    if (selectedSet.has(nmId)) {
      onChange(value.filter(id => id !== nmId))
    } else {
      onChange([...value, nmId])
    }
  }

  const totalProducts = data?.pagination?.total ?? products.length
  const hasSelection = value.length > 0
  const hasRetainedData = data !== undefined

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-label="Фильтр по товарам"
            aria-expanded={open}
            className="min-h-11 w-full min-w-0 justify-between font-normal text-muted-foreground sm:w-auto sm:min-w-[240px]"
          >
            <span className="truncate">
              {hasSelection
                ? `Выбрано: ${value.length} из ${totalProducts} товаров`
                : 'Фильтр по товарам'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Поиск по названию, бренду или nmId..."
              value={search}
              onValueChange={setSearch}
              className="min-h-11"
            />
            <CommandList>
              {isError ? (
                <div role="alert" className="space-y-3 px-3 py-4 text-center text-sm">
                  <p>
                    {hasRetainedData
                      ? 'Показаны ранее загруженные товары; обновление завершилось ошибкой.'
                      : 'Не удалось загрузить товары'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 min-w-11"
                    onClick={() => void refetch()}
                  >
                    Повторить загрузку товаров
                  </Button>
                </div>
              ) : isLoading && !hasRetainedData ? (
                <div role="status" className="space-y-2 py-6 text-center text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                  <p>Товары загружаются</p>
                </div>
              ) : filtered.length === 0 ? (
                <CommandEmpty>Товары не найдены</CommandEmpty>
              ) : null}
              {(!isError || hasRetainedData) &&
                filtered.map(p => (
                  <CommandItem
                    key={p.nmId}
                    value={String(p.nmId)}
                    onSelect={() => toggleProduct(p.nmId)}
                    className="min-h-11 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedSet.has(p.nmId) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm truncate">{p.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.brand ? `${p.brand} · ` : ''}nmId: {p.nmId}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              {(!isError || hasRetainedData) && !isLoading && totalProducts > products.length && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                  Показано {products.length} из {totalProducts}
                </p>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {hasSelection && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([])}
          className="min-h-11 w-full text-muted-foreground sm:w-auto"
        >
          <X className="h-3.5 w-3.5" />
          Сбросить
        </Button>
      )}
    </div>
  )
}
