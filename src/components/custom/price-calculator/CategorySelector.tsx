'use client'

/**
 * CategorySelector - Searchable combobox for WB product categories
 * Story 44.16-FE: Category Selection with Search
 * Story 44.26b-FE: Auto-fill Category with Lock/Unlock
 */

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ChevronsUpDown, X, Lock } from 'lucide-react'
import { cn, formatPercentage } from '@/lib/utils'
import { FieldTooltip } from './FieldTooltip'
import { AutoFillBadge } from './AutoFillBadge'
import { CategorySelectorLoading, CategorySelectorError } from './CategorySelectorStates'
import { CategoryCommandList } from './CategoryCommandList'
import { HIGH_COMMISSION_THRESHOLD } from './category-selector-constants'
import { useCategorySelectorState } from './useCategorySelectorState'
import type { CategoryCommission } from '@/types/tariffs'
import type { FulfillmentType, CategoryAutoFillState } from '@/types/price-calculator'

export interface CategorySelectorProps {
  value: CategoryCommission | null
  onChange: (category: CategoryCommission | null) => void
  fulfillmentType: FulfillmentType
  disabled?: boolean
  error?: string
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
  const {
    open,
    setOpen,
    searchInput,
    setSearchInput,
    debouncedSearch,
    filteredCategories,
    isLoading,
    apiError,
    refetch,
    getCommissionPct,
    formatCategoryName,
    handleSelect,
    handleClear,
  } = useCategorySelectorState(fulfillmentType, onChange)

  const isLocked = autoFillState?.isLocked ?? false
  const isAutoFilled = autoFillState?.source === 'auto'
  const effectiveDisabled = disabled || isLocked

  if (isLoading) return <CategorySelectorLoading />
  if (apiError) return <CategorySelectorError onRetry={() => refetch()} />

  const selectedCommission = value ? getCommissionPct(value) : null
  const isHighCommission =
    selectedCommission !== null && selectedCommission > HIGH_COMMISSION_THRESHOLD

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
            aria-label={
              isLocked ? 'Категория из карточки товара (заблокировано)' : 'Выбрать категорию товара'
            }
            disabled={effectiveDisabled}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive'
            )}
          >
            {value ? (
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{formatCategoryName(value)}</span>
                <Badge
                  variant={isHighCommission ? 'destructive' : 'secondary'}
                  className="ml-auto shrink-0"
                >
                  {/* value is narrowed truthy here → getCommissionPct returns a number. KGVP can be
                      FRACTIONAL (e.g. 32.5) → formatPercentage(_, 1), NOT Int (would round 32.5→33).
                      WB KGVP is ≤1 decimal in practice, so 1 decimal is lossless here.
                      Using value (not selectedCommission) avoids the number|null type. */}
                  {formatPercentage(getCommissionPct(value), 1)}
                </Badge>
                {isLocked && (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                )}
              </span>
            ) : (
              <span>Выберите категорию...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Поиск категории..."
              value={searchInput}
              onValueChange={setSearchInput}
            />
            <CategoryCommandList
              categories={filteredCategories}
              value={value}
              debouncedSearch={debouncedSearch}
              getCommissionPct={getCommissionPct}
              formatCategoryName={formatCategoryName}
              onSelect={handleSelect}
            />
          </Command>
        </PopoverContent>
      </Popover>

      {value && (
        <p className="text-xs text-muted-foreground">
          FBO: {formatPercentage(value.paidStorageKgvp, 1)} &bull; FBS:{' '}
          {formatPercentage(value.kgvpMarketplace, 1)}
        </p>
      )}
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
