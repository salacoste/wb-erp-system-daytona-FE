'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MultiSelectDropdown } from '@/components/custom/MultiSelectDropdown'
import { getLastCompletedWeek } from '@/lib/margin-helpers'

/**
 * Storage Analytics Filters
 * Story 24.2-FE: Storage Analytics Page Layout
 * Story 24.9-FE: Multi-select Brand & Warehouse Filters
 *
 * Includes:
 * - Week range picker (start/end)
 * - Brand multi-select filter
 * - Warehouse multi-select filter
 */
interface StorageFiltersProps {
  weekStart: string
  weekEnd: string
  selectedBrands: string[]
  selectedWarehouses: string[]
  /** Available brands derived from storage data */
  availableBrands: string[]
  /** Available warehouses derived from storage data */
  availableWarehouses: string[]
  /** Loading state for filter options */
  isLoadingOptions?: boolean
  onWeekRangeChange: (start: string, end: string) => void
  onBrandsChange: (brands: string[]) => void
  onWarehousesChange: (warehouses: string[]) => void
}

export function StorageFilters({
  weekStart,
  weekEnd,
  selectedBrands,
  selectedWarehouses,
  availableBrands,
  availableWarehouses,
  isLoadingOptions = false,
  onWeekRangeChange,
  onBrandsChange,
  onWarehousesChange,
}: StorageFiltersProps) {
  const lastCompletedWeek = getLastCompletedWeek()

  const handleWeekStartChange = (value: string) => {
    // Reset brand/warehouse filters on week range change per AC3
    onBrandsChange([])
    onWarehousesChange([])
    onWeekRangeChange(value, weekEnd)
  }

  const handleWeekEndChange = (value: string) => {
    // Reset brand/warehouse filters on week range change per AC3
    onBrandsChange([])
    onWarehousesChange([])
    onWeekRangeChange(weekStart, value)
  }

  const handleResetFilters = () => {
    // Reset to last 4 weeks
    const date = new Date()
    date.setDate(date.getDate() - 28)
    const fourWeeksAgo = `${date.getFullYear()}-W${String(Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 604800000)).padStart(2, '0')}`
    onWeekRangeChange(fourWeeksAgo, lastCompletedWeek)
    onBrandsChange([])
    onWarehousesChange([])
  }

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg border">
      {/* Week Range */}
      <div className="flex items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="week-start" className="text-xs">
            Период с
          </Label>
          <Input
            id="week-start"
            type="week"
            value={weekStart}
            onChange={(e) => handleWeekStartChange(e.target.value)}
            max={weekEnd}
            className="w-36"
          />
        </div>
        <span className="text-muted-foreground pb-2">—</span>
        <div className="space-y-1.5">
          <Label htmlFor="week-end" className="text-xs">
            по
          </Label>
          <Input
            id="week-end"
            type="week"
            value={weekEnd}
            onChange={(e) => handleWeekEndChange(e.target.value)}
            min={weekStart}
            max={lastCompletedWeek}
            className="w-36"
          />
        </div>
      </div>

      {/* Brand Filter - Story 24.9-FE */}
      <div className="space-y-1.5">
        <Label htmlFor="brand-filter" className="text-xs">
          Бренды
        </Label>
        <MultiSelectDropdown
          label="Бренды"
          options={availableBrands}
          selected={selectedBrands}
          onChange={onBrandsChange}
          placeholder="Все бренды"
          loading={isLoadingOptions}
          disabled={availableBrands.length === 0 && !isLoadingOptions}
          aria-label="Выберите бренды"
        />
      </div>

      {/* Warehouse Filter - Story 24.9-FE */}
      <div className="space-y-1.5">
        <Label htmlFor="warehouse-filter" className="text-xs">
          Склады
        </Label>
        <MultiSelectDropdown
          label="Склады"
          options={availableWarehouses}
          selected={selectedWarehouses}
          onChange={onWarehousesChange}
          placeholder="Все склады"
          loading={isLoadingOptions}
          disabled={availableWarehouses.length === 0 && !isLoadingOptions}
          aria-label="Выберите склады"
        />
      </div>

      {/* Reset Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleResetFilters}
        className="text-muted-foreground"
      >
        Сбросить
      </Button>
    </div>
  )
}
