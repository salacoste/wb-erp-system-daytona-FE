'use client'

/**
 * Pricing filters: target margin slider, gap filter, sort
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 */

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { GapFilter, SortOption } from './usePricingPageState'

interface PricingFiltersProps {
  targetMargin: number
  gapFilter: GapFilter
  sort: SortOption
  onTargetMarginChange: (value: number) => void
  onGapFilterChange: (value: GapFilter) => void
  onSortChange: (value: SortOption) => void
}

export function PricingFilters({
  targetMargin,
  gapFilter,
  sort,
  onTargetMarginChange,
  onGapFilterChange,
  onSortChange,
}: PricingFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-3">
            <Label>Целевая маржа: {targetMargin}%</Label>
            <Slider
              value={[targetMargin]}
              onValueChange={([v]) => onTargetMarginChange(v)}
              min={5}
              max={50}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Фильтр по разрыву</Label>
            <Select value={gapFilter} onValueChange={v => onGapFilterChange(v as GapFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Все товары" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все товары</SelectItem>
                <SelectItem value="below">Ниже цели</SelectItem>
                <SelectItem value="above">Выше цели</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Сортировка</Label>
            <Select value={sort} onValueChange={v => onSortChange(v as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="По умолчанию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">По умолчанию</SelectItem>
                <SelectItem value="gap_asc">Разрыв ↑ (возрастание)</SelectItem>
                <SelectItem value="gap_desc">Разрыв ↓ (убывание)</SelectItem>
                <SelectItem value="margin_asc">Маржа ↑ (возрастание)</SelectItem>
                <SelectItem value="margin_desc">Маржа ↓ (убывание)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
