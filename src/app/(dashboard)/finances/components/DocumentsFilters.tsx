'use client'

/**
 * DocumentsFilters — NEW-7 documents filter bar.
 *
 * Category dropdown (from useFinanceDocumentCategories), period date pickers
 * (native date inputs — accessible via <Label>), and sort/order selectors.
 * Stateless: all state is owned by DocumentsTable and threaded via props.
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import type { DocumentCategory, DocumentsSort, DocumentsOrder } from '@/types/finances'

export interface DocumentsFiltersProps {
  category: string
  onCategoryChange: (value: string) => void
  beginTime: string
  endTime: string
  onBeginTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  sort: DocumentsSort
  order: DocumentsOrder
  onSortChange: (value: DocumentsSort) => void
  onOrderChange: (value: DocumentsOrder) => void
  categoryOptions?: DocumentCategory[]
  categoryState?: 'ready' | 'loading' | 'error'
}

export function DocumentsFilters({
  category,
  onCategoryChange,
  beginTime,
  endTime,
  onBeginTimeChange,
  onEndTimeChange,
  sort,
  order,
  onSortChange,
  onOrderChange,
  categoryOptions,
  categoryState = 'ready',
}: DocumentsFiltersProps) {
  const categoryUnavailable = categoryState !== 'ready'

  return (
    <div className="flex flex-wrap items-end gap-3" role="group" aria-label="Фильтры документов">
      <div className="flex flex-col gap-1">
        <Label htmlFor="docs-category" className="text-xs text-muted-foreground">
          Категория
        </Label>
        <Select value={category} onValueChange={onCategoryChange} disabled={categoryUnavailable}>
          <SelectTrigger
            id="docs-category"
            className="h-9 w-[180px]"
            aria-describedby={categoryUnavailable ? 'docs-category-status' : undefined}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {/* Skip categories without a `name` (WB makes it optional): an empty
                value would collide with "all" + silently become a no-op filter. */}
            {(categoryOptions ?? [])
              .filter(opt => !!opt.name)
              .map(opt => (
                <SelectItem key={opt.name} value={opt.name as string}>
                  {opt.title ?? opt.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {categoryState === 'loading' && (
          <p id="docs-category-status" className="text-xs text-muted-foreground" role="status">
            Загрузка категорий…
          </p>
        )}
        {categoryState === 'error' && (
          <p id="docs-category-status" className="text-xs text-destructive" role="status">
            Категории временно недоступны
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="docs-begin" className="text-xs text-muted-foreground">
          Начало периода
        </Label>
        <Input
          id="docs-begin"
          type="date"
          value={beginTime}
          onChange={e => onBeginTimeChange(e.target.value)}
          className="h-9 w-[160px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="docs-end" className="text-xs text-muted-foreground">
          Конец периода
        </Label>
        <Input
          id="docs-end"
          type="date"
          value={endTime}
          onChange={e => onEndTimeChange(e.target.value)}
          className="h-9 w-[160px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="docs-sort" className="text-xs text-muted-foreground">
          Сортировка
        </Label>
        <Select value={sort} onValueChange={v => onSortChange(v as DocumentsSort)}>
          <SelectTrigger id="docs-sort" className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">По дате</SelectItem>
            <SelectItem value="category">По категории</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="docs-order" className="text-xs text-muted-foreground">
          Порядок
        </Label>
        <Select value={order} onValueChange={v => onOrderChange(v as DocumentsOrder)}>
          <SelectTrigger id="docs-order" className="h-9 w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">По убыванию</SelectItem>
            <SelectItem value="asc">По возрастанию</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
