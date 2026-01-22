'use client'

/**
 * WarehouseSection Component
 * Story 44.12-FE: Warehouse Selection
 * Story 44.13-FE: Auto-fill Coefficients
 * Story 44.14-FE: Storage Cost Calculation
 * Story 44.26a-FE: Delivery Date Selection
 * Epic 44: Price Calculator UI (Frontend)
 */

import { useState, useMemo, useCallback } from 'react'
import { Warehouse as WarehouseIcon, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { WarehouseSelect } from './WarehouseSelect'
import { CoefficientField } from './CoefficientField'
import { StorageCostCalculator } from './StorageCostCalculator'
import { DeliveryDatePicker } from './DeliveryDatePicker'
import { FieldTooltip } from './FieldTooltip'
import { useWarehouseCoefficients } from '@/hooks/useWarehouseCoefficients'
import type { Warehouse } from '@/types/warehouse'
import type { StorageTariff } from '@/lib/storage-cost-utils'

export interface WarehouseSectionProps {
  warehouseId: number | null
  onWarehouseChange: (id: number | null, warehouse: Warehouse | null) => void
  storageDays: number
  onStorageDaysChange: (days: number) => void
  storageRub: number
  onStorageChange: (value: number) => void
  volumeLiters: number
  disabled?: boolean
  fulfillmentType: 'FBO' | 'FBS'
  /** Delivery date change handler (Story 44.26a) */
  onDeliveryDateChange?: (date: string | null, coefficient: number) => void
}

/**
 * Warehouse section with coefficients, storage, and delivery date
 */
export function WarehouseSection({
  warehouseId,
  onWarehouseChange,
  storageDays,
  onStorageDaysChange,
  storageRub,
  onStorageChange,
  volumeLiters,
  disabled,
  fulfillmentType,
  onDeliveryDateChange,
}: WarehouseSectionProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)

  const {
    isLoading,
    logisticsCoeff,
    storageCoeff,
    setLogisticsValue,
    setStorageValue,
    restoreLogistics,
    restoreStorage,
    dailyCoefficients,
    byBoxType,
    deliveryDate,
    setDeliveryDate,
  } = useWarehouseCoefficients(warehouseId, selectedWarehouse)

  // Build storage tariff from warehouse data
  const storageTariff: StorageTariff | null = useMemo(() => {
    if (!selectedWarehouse) return null
    return {
      basePerDayRub: selectedWarehouse.tariffs.storageBaseLiterRub,
      perLiterPerDayRub: selectedWarehouse.tariffs.storagePerLiterRub,
      coefficient: storageCoeff.value,
    }
  }, [selectedWarehouse, storageCoeff.value])

  const handleWarehouseChange = useCallback(
    (id: number | null, warehouse: Warehouse | null) => {
      setSelectedWarehouse(warehouse)
      onWarehouseChange(id, warehouse)
    },
    [onWarehouseChange],
  )

  const handleDeliveryDateSelect = useCallback(
    (date: string, coefficient: number) => {
      setDeliveryDate(date, coefficient)
      onDeliveryDateChange?.(date, coefficient)
    },
    [setDeliveryDate, onDeliveryDateChange],
  )

  const showStorage = fulfillmentType === 'FBO'

  return (
    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-l-purple-400 space-y-5">
      {/* Story 44.30: Updated header to text-base font-semibold */}
      <div className="flex items-center gap-2 mb-4">
        <WarehouseIcon className="h-4 w-4 text-purple-600" aria-hidden="true" />
        <h3 className="text-base font-semibold text-purple-900">Склад и хранение</h3>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
      </div>

      {/* Warehouse Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Склад WB</Label>
          <FieldTooltip content="Выберите склад Wildberries для автоматического расчёта тарифов" />
        </div>
        <WarehouseSelect value={warehouseId} onChange={handleWarehouseChange} disabled={disabled} />
      </div>

      {/* Delivery Date Picker - Story 44.26a */}
      {warehouseId && (dailyCoefficients.length > 0 || byBoxType.length > 0) && (
        <DeliveryDatePicker
          coefficients={dailyCoefficients}
          byBoxType={byBoxType}
          selectedDate={deliveryDate.date}
          onDateSelect={handleDeliveryDateSelect}
          isLoading={isLoading}
        />
      )}

      {/* Coefficients */}
      {warehouseId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <CoefficientField
            label="Коэффициент логистики"
            value={logisticsCoeff.value}
            source={logisticsCoeff.source}
            originalValue={logisticsCoeff.originalValue}
            onChange={setLogisticsValue}
            onSourceChange={() => {}}
            onRestore={restoreLogistics}
            disabled={disabled}
            tooltip="Коэффициент увеличения стоимости логистики"
          />
          <CoefficientField
            label="Коэффициент хранения"
            value={storageCoeff.value}
            source={storageCoeff.source}
            originalValue={storageCoeff.originalValue}
            onChange={setStorageValue}
            onSourceChange={() => {}}
            onRestore={restoreStorage}
            disabled={disabled}
            tooltip="Коэффициент увеличения стоимости хранения"
          />
        </div>
      )}

      {/* Storage Cost Calculator - FBO only */}
      {showStorage && (
        <div className="pt-2 border-t border-purple-200">
          <StorageCostCalculator
            volumeLiters={volumeLiters}
            tariff={storageTariff}
            days={storageDays}
            onDaysChange={onStorageDaysChange}
            value={storageRub}
            onChange={onStorageChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}
