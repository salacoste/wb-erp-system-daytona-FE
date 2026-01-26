'use client'

/**
 * WarehouseSection Component
 * Story 44.12-FE: Warehouse Selection
 * Story 44.13-FE: Auto-fill Coefficients
 * Story 44.26a-FE: Delivery Date Selection
 * Story 44.34-FE: Debounce Warehouse Selection & Rate Limit Handling
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Note: Storage cost calculation moved to TurnoverDaysInput (turnover_days approach)
 */

import { useState, useCallback, useMemo } from 'react'
import { Warehouse as WarehouseIcon, Loader2 } from 'lucide-react'
import { WarehouseSelect } from './WarehouseSelect'
import { CoefficientField } from './CoefficientField'
import { DeliveryDatePicker } from './DeliveryDatePicker'
import { RateLimitWarning } from './RateLimitWarning'
import { CoefficientsLoadingSkeleton } from './CoefficientsLoadingSkeleton'
import { useWarehouseCoefficients } from '@/hooks/useWarehouseCoefficients'
import { useSupplyTariffs } from '@/hooks/useSupplyTariffs'
import type { Warehouse } from '@/types/warehouse'
import type { SupplyDateTariffs, ExtractedTariffs } from '@/lib/tariff-system-utils'

export interface WarehouseSectionProps {
  warehouseId: number | null
  onWarehouseChange: (id: number | null, warehouse: Warehouse | null) => void
  disabled?: boolean
  /** Delivery date change handler - Story 44.40: includes supply tariffs */
  onDeliveryDateChange?: (date: string | null, coefficient: number, supplyData?: SupplyDateTariffs) => void
  /** Story 44.40: Active tariff system for display */
  tariffSystem?: 'inventory' | 'supply'
  /** Story 44.40: Effective tariffs for display (includes displayLogisticsCoefficient) */
  effectiveTariffs?: ExtractedTariffs
}

/**
 * Warehouse section with coefficients and delivery date
 */
export function WarehouseSection({
  warehouseId,
  onWarehouseChange,
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
    // Story 44.34: Debouncing and rate limit state
    isDebouncing,
    isRateLimited,
    cooldownRemaining,
  } = useWarehouseCoefficients(warehouseId, selectedWarehouse)

  // Story 44.40: Fetch SUPPLY tariffs for all warehouses
  const { coefficients: supplyCoefficients, findTariffsForDate } = useSupplyTariffs()

  // Story 44.40: Create map of date -> SupplyDateTariffs for DeliveryDatePicker
  const supplyTariffsMap = useMemo(() => {
    if (!warehouseId || !supplyCoefficients.length) return new Map<string, SupplyDateTariffs>()

    const map = new Map<string, SupplyDateTariffs>()
    supplyCoefficients
      .filter((c) => c.warehouseId === warehouseId)
      .forEach((c) => {
        const dateKey = c.date.split('T')[0] // Normalize to YYYY-MM-DD
        if (!map.has(dateKey)) {
          // Transform to SupplyDateTariffs
          const tariffs: SupplyDateTariffs = {
            date: dateKey,
            warehouseId: c.warehouseId,
            warehouseName: c.warehouseName,
            coefficient: c.coefficient,
            isAvailable: c.isAvailable,
            allowUnload: c.allowUnload,
            boxTypeId: c.boxTypeId,
            boxTypeName: c.boxTypeName,
            delivery: c.delivery,
            storage: c.storage,
            isSortingCenter: c.isSortingCenter,
          }
          map.set(dateKey, tariffs)
        }
      })
    return map
  }, [warehouseId, supplyCoefficients])

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
      // Story 44.40: Find supply tariffs for this date and pass to parent
      const supplyData = warehouseId ? findTariffsForDate(warehouseId, date) : null
      console.info('[WarehouseSection] handleDeliveryDateSelect:', {
        date,
        coefficient,
        warehouseId,
        hasSupplyData: !!supplyData,
        supplyDeliveryBase: supplyData?.delivery?.baseLiterRub,
        supplyDeliveryCoeff: supplyData?.delivery?.coefficient,
      })
      onDeliveryDateChange?.(date, coefficient, supplyData ?? undefined)
    },
    [setDeliveryDate, onDeliveryDateChange, findTariffsForDate, warehouseId],
  )

  return (
    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-l-purple-400 space-y-5">
      {/* Story 44.30: Updated header to text-base font-semibold */}
      <div className="flex items-center gap-2 mb-4">
        <WarehouseIcon className="h-4 w-4 text-purple-600" aria-hidden="true" />
        <h3 className="text-base font-semibold text-purple-900">Склад и хранение</h3>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-purple-500" role="status" aria-label="Загрузка данных склада" />}
      </div>

      {/* Warehouse Selection - label is in WarehouseSelect component (Story 44.34) */}
      {/* Story 44.40: Use SUPPLY warehouses to ensure ID matching */}
      {/* Story 44.42: Tariffs now shown by box type (Boxes, Pallets, Supersafe) */}
      <WarehouseSelect
        value={warehouseId}
        onChange={handleWarehouseChange}
        disabled={disabled || isRateLimited}
        deliveryDate={deliveryDate.date}
        useSupplySource
      />

      {/* Story 44.34: Rate Limit Warning with progress bar (AC3, AC4) */}
      {isRateLimited && (
        <RateLimitWarning
          remainingSeconds={cooldownRemaining}
          retryAfter={cooldownRemaining}
          endpointName="коэффициентов приёмки"
        />
      )}

      {/* Story 44.34: Loading skeleton during debounce (AC2) */}
      {isDebouncing && warehouseId && (
        <CoefficientsLoadingSkeleton fieldCount={2} message="Загрузка коэффициентов склада..." />
      )}

      {/* Delivery Date Picker - Story 44.26a, Story 44.40 */}
      {/* Story 44.40: Pass supplyTariffsMap for two tariff systems integration */}
      {warehouseId && (
        <DeliveryDatePicker
          coefficients={dailyCoefficients}
          byBoxType={byBoxType}
          selectedDate={deliveryDate.date}
          onDateSelect={handleDeliveryDateSelect}
          supplyTariffsMap={supplyTariffsMap}
          isLoading={isLoading && !isDebouncing}
          showFallback={!isLoading && !isDebouncing && dailyCoefficients.length === 0 && byBoxType.length === 0}
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

    </div>
  )
}
