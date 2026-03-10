'use client'

import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { MAX_VISIBLE_RESULTS, HIGH_COMMISSION_THRESHOLD } from './category-selector-constants'
import type { CategoryCommission } from '@/types/tariffs'

interface CategoryCommandListProps {
  categories: CategoryCommission[]
  value: CategoryCommission | null
  debouncedSearch: string
  getCommissionPct: (category: CategoryCommission) => number
  formatCategoryName: (category: CategoryCommission) => string
  onSelect: (category: CategoryCommission) => void
}

/**
 * Category dropdown list with commission badges
 * Extracted from CategorySelector for file size compliance (Story 74.8)
 */
export function CategoryCommandList({
  categories,
  value,
  debouncedSearch,
  getCommissionPct,
  formatCategoryName,
  onSelect,
}: CategoryCommandListProps) {
  return (
    <CommandList>
      {categories.length === 0 && debouncedSearch && (
        <CommandEmpty>Категории не найдены</CommandEmpty>
      )}
      <CommandGroup>
        {categories.map(category => {
          const commissionPct = getCommissionPct(category)
          const isHigh = commissionPct > HIGH_COMMISSION_THRESHOLD
          const isSelected =
            value?.parentID === category.parentID && value?.subjectID === category.subjectID
          return (
            <CommandItem
              key={`${category.parentID}-${category.subjectID}`}
              value={`${category.parentID}-${category.subjectID}`}
              onSelect={() => onSelect(category)}
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
      {categories.length === MAX_VISIBLE_RESULTS && (
        <div className="px-2 py-1.5 text-xs text-muted-foreground text-center border-t">
          Показаны первые {MAX_VISIBLE_RESULTS} результатов. Уточните поиск.
        </div>
      )}
    </CommandList>
  )
}
