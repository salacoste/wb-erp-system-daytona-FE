'use client'

/**
 * ProductCombobox - Lightweight product search/select for Search Analytics
 * Story 71.6-FE: By-Product Keyword Explorer Tab
 */

import { useState, useEffect, useRef } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Search, X, Package, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_MIN_LENGTH = 2

interface ProductComboboxProps {
  value: number | undefined
  onChange: (nmId: number | undefined) => void
}

interface SelectedInfo {
  nmId: number
  name: string
  brand?: string
}

export function ProductCombobox({ value, onChange }: ProductComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<SelectedInfo | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const shouldSearch = debouncedSearch.length >= SEARCH_MIN_LENGTH
  const { data, isLoading } = useProducts(
    shouldSearch ? { search: debouncedSearch, limit: 20 } : {}
  )
  const products = shouldSearch ? (data?.products ?? []) : []

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [searchInput])

  const handleSelect = (nmIdStr: string, name: string, brand?: string) => {
    const nmId = Number(nmIdStr)
    setSelected({ nmId, name, brand })
    onChange(nmId)
    setOpen(false)
    setSearchInput('')
    setDebouncedSearch('')
  }

  const handleClear = () => {
    setSelected(null)
    onChange(undefined)
    setSearchInput('')
    setDebouncedSearch('')
  }

  if (value && selected) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">{selected.name}</span>
          <span className="text-xs text-muted-foreground">
            {selected.brand ? `${selected.brand} · ` : ''}nmId: {selected.nmId}
          </span>
        </div>
        <button
          onClick={handleClear}
          className="rounded-full p-1 hover:bg-background transition-colors"
          aria-label="Очистить выбор товара"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Поиск товара"
          className="w-full justify-between font-normal text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Выберите товар для анализа...
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Поиск по названию, артикулу или nmId..."
            value={searchInput}
            onValueChange={setSearchInput}
          />
          <CommandList>
            {!shouldSearch && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Введите минимум 2 символа для поиска
              </p>
            )}
            {shouldSearch && isLoading && (
              <p className="py-4 text-center text-sm text-muted-foreground">Поиск...</p>
            )}
            {shouldSearch && !isLoading && products.length === 0 && (
              <CommandEmpty>Товары не найдены</CommandEmpty>
            )}
            {products.map(p => (
              <CommandItem
                key={p.nm_id}
                value={p.nm_id}
                onSelect={() => handleSelect(p.nm_id, p.sa_name, p.brand)}
                className={cn('cursor-pointer')}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{p.sa_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.brand ? `${p.brand} · ` : ''}nmId: {p.nm_id}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
