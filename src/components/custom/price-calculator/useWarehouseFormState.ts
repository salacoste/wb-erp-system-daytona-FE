import { useState, useMemo, useCallback } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import type { Warehouse } from '@/types/warehouse'
import type { FormData } from './usePriceCalculatorForm'
import { calculateDailyStorageCost, DEFAULT_STORAGE_TARIFF } from '@/lib/storage-cost-utils'

/**
 * Hook for managing warehouse-related form state
 * Story 44.27-FE: Warehouse & Coefficients Integration
 * Story 44.XX: Simplified storage - dailyStorageCost for TurnoverDaysInput
 *
 * Handles:
 * - Warehouse selection state
 * - Daily storage cost calculation (for TurnoverDaysInput)
 * - Volume calculation from dimensions
 * - Form value synchronization
 */
export interface UseWarehouseFormStateProps {
  setValue: UseFormSetValue<FormData>
  lengthCm: number
  widthCm: number
  heightCm: number
}

export interface UseWarehouseFormStateReturn {
  warehouseId: number | null
  /** Daily storage cost per unit (RUB/day) for TurnoverDaysInput */
  dailyStorageCost: number
  /** Current storage_rub value from form */
  storageRub: number
  volumeLiters: number
  handleWarehouseChange: (id: number | null, warehouse: Warehouse | null) => void
  /** Handler for TurnoverDaysInput storage_rub emission */
  handleStorageRubChange: (value: number) => void
  handleDeliveryDateChange: (date: string | null, coefficient: number) => void
  // Story 44.27: Method to get warehouse object for API request
  getWarehouseForApi: (warehouses: Warehouse[]) => Warehouse | null
}

export function useWarehouseFormState({
  setValue,
  lengthCm,
  widthCm,
  heightCm,
}: UseWarehouseFormStateProps): UseWarehouseFormStateReturn {
  const [warehouseId, setWarehouseId] = useState<number | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [storageRub, setStorageRub] = useState(0)

  // Calculate volume from dimensions (cm to liters)
  const volumeLiters = useMemo(() => {
    if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0
    return (lengthCm * widthCm * heightCm) / 1000
  }, [lengthCm, widthCm, heightCm])

  // Calculate daily storage cost from warehouse tariff and volume
  const dailyStorageCost = useMemo(() => {
    const tariff = selectedWarehouse
      ? {
          basePerDayRub: selectedWarehouse.tariffs.storageBaseLiterRub,
          perLiterPerDayRub: selectedWarehouse.tariffs.storagePerLiterRub,
          coefficient: 1.0, // Storage coefficient applied separately
        }
      : DEFAULT_STORAGE_TARIFF
    return calculateDailyStorageCost(volumeLiters, tariff)
  }, [selectedWarehouse, volumeLiters])

  const handleWarehouseChange = useCallback(
    (id: number | null, warehouse: Warehouse | null) => {
      setWarehouseId(id)
      setSelectedWarehouse(warehouse)
      setValue('warehouse_id', id)
      setValue('warehouse_name', warehouse?.name ?? null)
    },
    [setValue],
  )

  // Handler for TurnoverDaysInput to emit calculated storage_rub
  const handleStorageRubChange = useCallback(
    (value: number) => {
      setStorageRub(value)
      setValue('storage_rub', value)
    },
    [setValue],
  )

  const handleDeliveryDateChange = useCallback(
    (date: string | null, coefficient: number) => {
      setValue('delivery_date', date)
      setValue('logistics_coefficient', coefficient)
    },
    [setValue],
  )

  // Story 44.27: Get warehouse object for API request
  const getWarehouseForApi = useCallback(
    (warehouses: Warehouse[]) => {
      if (!warehouseId) return null
      return warehouses.find(w => w.id === warehouseId) || null
    },
    [warehouseId],
  )

  return {
    warehouseId,
    dailyStorageCost,
    storageRub,
    volumeLiters,
    handleWarehouseChange,
    handleStorageRubChange,
    handleDeliveryDateChange,
    getWarehouseForApi,
  }
}
