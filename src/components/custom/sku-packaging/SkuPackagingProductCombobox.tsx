'use client'

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

interface SkuPackagingProductComboboxProps {
  id?: string
  value: number | null
  onChange: (nmId: number | null) => void
  disabled?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export function SkuPackagingProductCombobox({
  id,
  value,
  onChange,
  disabled,
  ...ariaProps
}: SkuPackagingProductComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedLabel, setSelectedLabel] = useState('')

  useEffect(() => {
    if (search.length < 2) return setDebouncedSearch('')
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])
  useEffect(() => {
    if (!value) setSelectedLabel('')
  }, [value])

  const { data, isLoading, isError, refetch } = useProducts({
    search: debouncedSearch || undefined,
    limit: 20,
  })
  const products = data?.products ?? []
  const displayValue = value ? selectedLabel || String(value) : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-label="Товар (nmId)"
          aria-expanded={open}
          aria-describedby={ariaProps['aria-describedby']}
          aria-invalid={ariaProps['aria-invalid']}
          className="min-h-11 w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className="truncate">{displayValue || 'Выберите товар...'}</span>
          <ChevronsUpDown aria-hidden="true" className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0 sm:w-[400px]"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Поиск по nmId или артикулу..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Загрузка...</CommandEmpty>}
            {!isLoading && !isError && search.length < 2 && (
              <CommandEmpty>Введите минимум 2 символа</CommandEmpty>
            )}
            {!isLoading && !isError && search.length >= 2 && products.length === 0 && (
              <CommandEmpty>Товары не найдены</CommandEmpty>
            )}
            {!isError && products.length > 0 && (
              <CommandGroup>
                {products.map(product => (
                  <CommandItem
                    key={product.nm_id}
                    value={String(product.nm_id)}
                    onSelect={() => {
                      onChange(Number(product.nm_id))
                      setSelectedLabel(`${product.nm_id} — ${product.sa_name || ''}`)
                      setOpen(false)
                    }}
                  >
                    <span className="font-medium">{product.nm_id}</span>
                    <span className="ml-2 truncate text-muted-foreground">
                      {product.sa_name} {product.brand ? `(${product.brand})` : ''}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
        {isError && (
          <div role="alert" className="space-y-2 border-t p-3 text-sm text-destructive">
            <p>Не удалось загрузить товары.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
