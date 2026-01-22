'use client'

/**
 * CategorySelector - Searchable combobox for WB product categories
 * Story 44.16-FE: Category Selection with Search
 * Story 44.26b-FE: Auto-fill Category with Lock/Unlock
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Check, ChevronsUpDown, X, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCommissions } from '@/hooks/useCommissions'
import { FieldTooltip } from './FieldTooltip'
import { AutoFillBadge } from './AutoFillBadge'
import { CategorySelectorLoading, CategorySelectorError } from './CategorySelectorStates'
import type { CategoryCommission } from '@/types/tariffs'
import type { FulfillmentType, CategoryAutoFillState } from '@/types/price-calculator'

const MAX_VISIBLE_RESULTS = 50
const SEARCH_DEBOUNCE_MS = 300
const HIGH_COMMISSION_THRESHOLD = 25

export interface CategorySelectorProps {
  value: CategoryCommission | null
  onChange: (category: CategoryCommission | null) => void
  fulfillmentType: FulfillmentType
  disabled?: boolean
  error?: string
  /** Auto-fill state for category (Story 44.26b) */
  autoFillState?: CategoryAutoFillState
}

export function CategorySelector({
  value,
  onChange,
  fulfillmentType,
  disabled = false,
  error,
  autoFillState,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { data: commissionsData, isLoading, error: apiError, refetch } = useCommissions()
  const categories = commissionsData?.commissions ?? []

  // Lock state from auto-fill (Story 44.26b)
  const isLocked = autoFillState?.isLocked ?? false
  const isAutoFilled = autoFillState?.source === 'auto'
  const effectiveDisabled = disabled || isLocked

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [searchInput])

  const filteredCategories = useMemo(() => {
    if (!debouncedSearch.trim()) return categories.slice(0, MAX_VISIBLE_RESULTS)
    const query = debouncedSearch.toLowerCase()
    return categories
      .filter((c) => c.parentName.toLowerCase().includes(query) || c.subjectName.toLowerCase().includes(query))
      .slice(0, MAX_VISIBLE_RESULTS)
  }, [categories, debouncedSearch])

  const getCommissionPct = useCallback(
    (category: CategoryCommission) => (fulfillmentType === 'FBO' ? category.paidStorageKgvp : category.kgvpMarketplace),
    [fulfillmentType],
  )

  const formatCategoryName = (category: CategoryCommission) => `${category.parentName} → ${category.subjectName}`

  const handleSelect = (category: CategoryCommission) => {
    onChange(category); setOpen(false); setSearchInput(''); setDebouncedSearch('')
  }
  const handleClear = () => { onChange(null); setSearchInput(''); setDebouncedSearch('') }

  if (isLoading) return <CategorySelectorLoading />
  if (apiError) return <CategorySelectorError onRetry={() => refetch()} />

  const selectedCommission = value ? getCommissionPct(value) : null
  const isHighCommission = selectedCommission !== null && selectedCommission > HIGH_COMMISSION_THRESHOLD

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="flex-1">Категория товара</Label>
        {isAutoFilled && <AutoFillBadge status="auto" />}
        <FieldTooltip content="Категория определяет комиссию WB. FBO и FBS имеют разные ставки. Поиск среди 7346 категорий." />
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={isLocked ? 'Категория из карточки товара (заблокировано)' : 'Выбрать категорию товара'}
            disabled={effectiveDisabled}
            className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', error && 'border-destructive')}
          >
            {value ? (
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{formatCategoryName(value)}</span>
                <Badge variant={isHighCommission ? 'destructive' : 'secondary'} className="ml-auto shrink-0">
                  {selectedCommission}%
                </Badge>
                {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />}
              </span>
            ) : (
              <span>Выберите категорию...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Поиск категории..." value={searchInput} onValueChange={setSearchInput} />
            <CommandList>
              {filteredCategories.length === 0 && debouncedSearch && <CommandEmpty>Категории не найдены</CommandEmpty>}
              <CommandGroup>
                {filteredCategories.map((category) => {
                  const commissionPct = getCommissionPct(category)
                  const isHigh = commissionPct > HIGH_COMMISSION_THRESHOLD
                  const isSelected = value?.parentID === category.parentID && value?.subjectID === category.subjectID

                  return (
                    <CommandItem
                      key={`${category.parentID}-${category.subjectID}`}
                      value={`${category.parentID}-${category.subjectID}`}
                      onSelect={() => handleSelect(category)}
                      className="cursor-pointer"
                    >
                      <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                      <span className="flex-1 truncate">{formatCategoryName(category)}</span>
                      <Badge variant={isHigh ? 'destructive' : 'secondary'} className="ml-2 shrink-0">
                        {commissionPct}%
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {filteredCategories.length === MAX_VISIBLE_RESULTS && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center border-t">
                  Показаны первые {MAX_VISIBLE_RESULTS} результатов. Уточните поиск.
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value && !effectiveDisabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Очистить выбор
        </Button>
      )}

      {isLocked && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Категория из карточки товара WB
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
