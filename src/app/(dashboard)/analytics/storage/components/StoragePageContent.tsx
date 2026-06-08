'use client'

import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StorageFilters } from './StorageFilters'

interface StorageNoDataContentProps {
  weekStart: string
  weekEnd: string
  selectedBrands: string[]
  selectedWarehouses: string[]
  availableBrands: string[]
  availableWarehouses: string[]
  isLoadingOptions: boolean
  onWeekRangeChange: (start: string, end: string) => void
  onBrandsChange: (brands: string[]) => void
  onWarehousesChange: (warehouses: string[]) => void
}

/**
 * Empty-state view for storage analytics when no data exists for the period.
 * Shows filters so the user can adjust, plus a helpful message.
 */
export function StorageNoDataContent({
  weekStart,
  weekEnd,
  selectedBrands,
  selectedWarehouses,
  availableBrands,
  availableWarehouses,
  isLoadingOptions,
  onWeekRangeChange,
  onBrandsChange,
  onWarehousesChange,
}: StorageNoDataContentProps) {
  return (
    <>
      <StorageFilters
        weekStart={weekStart}
        weekEnd={weekEnd}
        selectedBrands={selectedBrands}
        selectedWarehouses={selectedWarehouses}
        availableBrands={availableBrands}
        availableWarehouses={availableWarehouses}
        isLoadingOptions={isLoadingOptions}
        onWeekRangeChange={onWeekRangeChange}
        onBrandsChange={onBrandsChange}
        onWarehousesChange={onWarehousesChange}
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Нет данных за выбранный период
          </h3>
          <p className="text-muted-foreground mb-4">
            По периоду с {weekStart} по {weekEnd} отсутствуют данные о расходах на хранение.
          </p>
          <p className="text-sm text-muted-foreground">
            Попробуйте выбрать другой период времени или загрузите данные через импорт WB API.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
