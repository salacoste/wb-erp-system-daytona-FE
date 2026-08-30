'use client'

import { useId, type RefObject } from 'react'
import { FilterToolbar } from '@/components/product/filters'
import { Input } from '@/components/ui/input'

interface SkuPackagingFilterToolbarProps {
  query: string
  total: number
  empty: boolean
  busy: boolean
  onQueryChange: (value: string) => void
  onReset: () => void
  inputRef?: RefObject<HTMLInputElement | null>
}

export function SkuPackagingFilterToolbar({
  query,
  total,
  empty,
  busy,
  onQueryChange,
  onReset,
  inputRef,
}: SkuPackagingFilterToolbarProps) {
  const inputId = useId()
  const applied = query.trim().length > 0
  const primaryControls = (
    <div className="w-full min-w-0 space-y-2 sm:max-w-md">
      <label htmlFor={inputId} className="block text-sm font-medium">
        Поиск по SKU, товару или типу коробки
      </label>
      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        value={query}
        onChange={event => onQueryChange(event.target.value)}
        placeholder="Например, 123456789 или Коробка A"
        className="min-h-11"
      />
    </div>
  )
  const shared = {
    label: 'Фильтр привязок упаковки',
    primaryControls,
    resultLabel: 'Найдено привязок',
    resetLabel: 'Показать все привязки',
    resetFocusRef: inputRef,
  }
  if (busy) return <FilterToolbar {...shared} state="updating" resultCount={total} />
  if (!applied) return <FilterToolbar {...shared} state="default" resultCount={total} />
  if (empty)
    return (
      <FilterToolbar
        {...shared}
        state="empty"
        appliedSummary={`Поиск: «${query.trim()}»`}
        resultCount={0}
        onReset={onReset}
        resetScope="Поиск по привязкам упаковки"
      />
    )
  return (
    <FilterToolbar
      {...shared}
      state="applied"
      appliedSummary={`Поиск: «${query.trim()}»`}
      resultCount={total}
      onReset={onReset}
      resetScope="Поиск по привязкам упаковки"
    />
  )
}
