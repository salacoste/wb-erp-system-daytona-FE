'use client'

/** Searchable product combobox — Epic 75-FE, Story 75.3 (AC: #4) */

import { useEffect, useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useProducts } from '@/hooks/useProducts'

interface ProductComboboxProps {
  value: number | null
  onChange: (nmId: number | null) => void
  disabled?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export function ProductCombobox({ value, onChange, disabled, ...ariaProps }: ProductComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedLabel, setSelectedLabel] = useState('')

  useEffect(() => {
    if (search.length < 2) {
      setDebouncedSearch('')
      return
    }
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!value) setSelectedLabel('')
  }, [value])

  const { data, isLoading } = useProducts({
    search: debouncedSearch || undefined,
    limit: 20,
  })

  const products = data?.products ?? []
  const displayValue = value ? selectedLabel || String(value) : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-describedby={ariaProps['aria-describedby']}
          aria-invalid={ariaProps['aria-invalid']}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className="truncate">{displayValue || 'Выберите товар...'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Поиск по nmId или артикулу..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Загрузка...</CommandEmpty>}
            {!isLoading && search.length < 2 && (
              <CommandEmpty>Введите минимум 2 символа</CommandEmpty>
            )}
            {!isLoading && search.length >= 2 && products.length === 0 && (
              <CommandEmpty>Товары не найдены</CommandEmpty>
            )}
            {products.length > 0 && (
              <CommandGroup>
                {products.map(p => (
                  <CommandItem
                    key={p.nm_id}
                    value={String(p.nm_id)}
                    onSelect={() => {
                      onChange(Number(p.nm_id))
                      setSelectedLabel(`${p.nm_id} — ${p.sa_name || ''}`)
                      setOpen(false)
                    }}
                  >
                    <span className="font-medium">{p.nm_id}</span>
                    <span className="ml-2 text-muted-foreground truncate">
                      {p.sa_name} {p.brand ? `(${p.brand})` : ''}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
