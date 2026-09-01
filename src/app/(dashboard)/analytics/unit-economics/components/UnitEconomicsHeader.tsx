'use client'

import { RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { UnitEconomicsViewBy } from '@/types/unit-economics'

const VIEW_OPTIONS: Array<{ value: UnitEconomicsViewBy; label: string }> = [
  { value: 'sku', label: 'SKU' },
  { value: 'category', label: 'Категория' },
  { value: 'brand', label: 'Бренд' },
  { value: 'total', label: 'Итого' },
]

/**
 * Unit Economics Page Header
 * Story 5.2: Unit Economics Page Structure
 *
 * Contains page title, week selector, view toggle, refresh and export buttons.
 */

interface UnitEconomicsHeaderProps {
  selectedWeek: string
  weekOptions: Array<{ value: string; label: string }>
  viewBy: UnitEconomicsViewBy
  onWeekChange: (week: string) => void
  onViewByChange: (view: string) => void
  onRefresh: () => void
  onExport: () => void
  isRefreshing?: boolean
  lastUpdated?: Date
}

export function UnitEconomicsHeader({
  selectedWeek,
  weekOptions,
  viewBy,
  onWeekChange,
  onViewByChange,
  onRefresh,
  onExport,
  isRefreshing = false,
  lastUpdated,
}: UnitEconomicsHeaderProps) {
  const lastUpdatedText = lastUpdated
    ? formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ru })
    : null

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Юнит-экономика</h1>
        <p className="text-sm text-muted-foreground">
          Анализ структуры затрат и маржинальности по товарам
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Week Selector */}
        <Select value={selectedWeek} onValueChange={onWeekChange}>
          <SelectTrigger className="w-[220px] h-9" aria-label="Выбор недели">
            <SelectValue placeholder="Выберите неделю" />
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div
          role="radiogroup"
          aria-label="Группировка данных"
          className="hidden h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground md:flex"
        >
          {VIEW_OPTIONS.map(option => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="unit-economics-view"
                value={option.value}
                aria-label={option.label}
                checked={viewBy === option.value}
                onChange={() => onViewByChange(option.value)}
                className="peer sr-only"
              />
              <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all peer-checked:bg-background peer-checked:text-foreground peer-checked:shadow peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                {option.label}
              </span>
            </label>
          ))}
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>

        {/* Export Button */}
        <Button variant="outline" size="sm" onClick={onExport} className="h-9">
          <Download className="h-4 w-4 mr-2" />
          CSV
        </Button>
      </div>

      {/* Last Updated */}
      {lastUpdatedText && (
        <div className="text-xs text-muted-foreground sm:absolute sm:right-6 sm:top-4">
          Обновлено {lastUpdatedText}
        </div>
      )}
    </div>
  )
}
