import { useState, useMemo, useCallback } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import type { Warehouse } from '@/types/warehouse'
import type { FormData } from './usePriceCalculatorForm'

/**
 * Hook for managing warehouse-related form state
 * Story 44.27-FE: Warehouse & Coefficients Integration
 *
 * Handles:
 * - Warehouse selection state
 * - Storage days and storage cost
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
  storageDays: number
  storageRub: number
  volumeLiters: number
  handleWarehouseChange: (id: number | null, warehouse: Warehouse | null) => void
  handleStorageDaysChange: (days: number) => void
  handleStorageChange: (value: number) => void
  handleDeliveryDateChange: (date: string | null, coefficient: number) => void
}

export function useWarehouseFormState({
  setValue,
  lengthCm,
  widthCm,
  heightCm,
}: UseWarehouseFormStateProps): UseWarehouseFormStateReturn {
  const [warehouseId, setWarehouseId] = useState<number | null>(null)
  const [storageDays, setStorageDays] = useState(14)
  const [storageRub, setStorageRub] = useState(0)

  // Calculate volume from dimensions (cm to liters)
  const volumeLiters = useMemo(() => {
    if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0
    return (lengthCm * widthCm * heightCm) / 1000
  }, [lengthCm, widthCm, heightCm])

  const handleWarehouseChange = useCallback(
    (id: number | null, warehouse: Warehouse | null) => {
      setWarehouseId(id)
      setValue('warehouse_id', id)
      setValue('warehouse_name', warehouse?.name ?? null)
    },
    [setValue],
  )

  const handleStorageDaysChange = useCallback(
    (days: number) => {
      setStorageDays(days)
      setValue('storage_days', days)
    },
    [setValue],
  )

  const handleStorageChange = useCallback(
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

  return {
    warehouseId,
    storageDays,
    storageRub,
    volumeLiters,
    handleWarehouseChange,
    handleStorageDaysChange,
    handleStorageChange,
    handleDeliveryDateChange,
  }
}
