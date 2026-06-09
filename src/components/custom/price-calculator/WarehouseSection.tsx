'use client'

/**
 * WarehouseSection Component
 * Story 44.12-FE: Warehouse Selection
 * Story 44.13-FE: Auto-fill Coefficients
 * Story 44.26a-FE: Delivery Date Selection
 * Story 44.34-FE: Debounce Warehouse Selection & Rate Limit Handling
 * Story 44.40-FE: Two Tariff Systems Integration
 */

import { useState, useCallback } from 'react'
import { Warehouse as WarehouseIcon, Loader2 } from 'lucide-react'
import { WarehouseSelect } from './WarehouseSelect'
import { CoefficientField } from './CoefficientField'
import { DeliveryDatePicker } from './DeliveryDatePicker'
import { SupplyTariffInfo } from './SupplyTariffInfo'
import { RateLimitWarning } from './RateLimitWarning'
import { CoefficientsLoadingSkeleton } from './CoefficientsLoadingSkeleton'
import { useWarehouseCoefficients } from '@/hooks/useWarehouseCoefficients'
import { useSupplyTariffsMap } from './useWarehouseSectionData'
import type { Warehouse } from '@/types/warehouse'
import type { SupplyDateTariffs, ExtractedTariffs } from '@/lib/tariff-system-utils'

export interface WarehouseSectionProps {
  warehouseId: number | null
  onWarehouseChange: (id: number | null, warehouse: Warehouse | null) => void
  onSetWarehouseById?: (id: number, warehouses: Warehouse[]) => void
  disabled?: boolean
  onDeliveryDateChange?: (
    date: string | null,
    coefficient: number,
    supplyData?: SupplyDateTariffs
  ) => void
  tariffSystem?: 'inventory' | 'supply'
  effectiveTariffs?: ExtractedTariffs
}

export function WarehouseSection({
  warehouseId,
  onWarehouseChange,
  onSetWarehouseById,
  disabled,
  onDeliveryDateChange,
  tariffSystem,
  effectiveTariffs,
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
    isDebouncing,
    isRateLimited,
    cooldownRemaining,
  } = useWarehouseCoefficients(warehouseId, selectedWarehouse)

  const { supplyTariffsMap, findTariffsForDate } = useSupplyTariffsMap(warehouseId)

  const handleWarehouseChange = useCallback(
    (id: number | null, warehouse: Warehouse | null) => {
      setSelectedWarehouse(warehouse)
      onWarehouseChange(id, warehouse)
    },
    [onWarehouseChange]
  )

  const handleDeliveryDateSelect = useCallback(
    (date: string, coefficient: number) => {
      setDeliveryDate(date, coefficient)
      const supplyData = warehouseId ? findTariffsForDate(warehouseId, date) : null
      onDeliveryDateChange?.(date, coefficient, supplyData ?? undefined)
    },
    [setDeliveryDate, onDeliveryDateChange, findTariffsForDate, warehouseId]
  )

  return (
    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-l-purple-400 space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <WarehouseIcon className="h-4 w-4 text-purple-600" aria-hidden="true" />
        <h3 className="text-base font-semibold text-purple-900">Склад и хранение</h3>
        {isLoading && (
          <Loader2
            className="h-4 w-4 animate-spin text-purple-500"
            role="status"
            aria-label="Загрузка данных склада"
          />
        )}
      </div>

      <WarehouseSelect
        value={warehouseId}
        onChange={handleWarehouseChange}
        onSetWarehouseById={onSetWarehouseById}
        disabled={disabled || isRateLimited}
        deliveryDate={deliveryDate.date}
        useSupplySource
      />

      {isRateLimited && (
        <RateLimitWarning
          remainingSeconds={cooldownRemaining}
          retryAfter={cooldownRemaining}
          endpointName="коэффициентов приёмки"
        />
      )}
      {isDebouncing && warehouseId && (
        <CoefficientsLoadingSkeleton fieldCount={2} message="Загрузка коэффициентов склада..." />
      )}

      {warehouseId && (
        <DeliveryDatePicker
          coefficients={dailyCoefficients}
          byBoxType={byBoxType}
          selectedDate={deliveryDate.date}
          onDateSelect={handleDeliveryDateSelect}
          supplyTariffsMap={supplyTariffsMap}
          isLoading={isLoading && !isDebouncing}
          showFallback={
            !isLoading && !isDebouncing && dailyCoefficients.length === 0 && byBoxType.length === 0
          }
        />
      )}

      {warehouseId && tariffSystem !== 'supply' && (
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
            isWarehouseLocked={!!warehouseId}
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
            isWarehouseLocked={!!warehouseId}
          />
        </div>
      )}

      {warehouseId && tariffSystem === 'supply' && effectiveTariffs && (
        <SupplyTariffInfo effectiveTariffs={effectiveTariffs} />
      )}
    </div>
  )
}
