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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { UnitEconomicsViewBy } from '@/types/unit-economics'

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
          <SelectTrigger className="w-[220px] h-9">
            <SelectValue placeholder="Выберите неделю" />
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <Tabs value={viewBy} onValueChange={onViewByChange} className="hidden md:block">
          <TabsList className="h-9">
            <TabsTrigger value="sku" className="text-xs px-3">
              SKU
            </TabsTrigger>
            <TabsTrigger value="category" className="text-xs px-3">
              Категория
            </TabsTrigger>
            <TabsTrigger value="brand" className="text-xs px-3">
              Бренд
            </TabsTrigger>
            <TabsTrigger value="total" className="text-xs px-3">
              Итого
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
