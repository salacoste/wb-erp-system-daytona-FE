import { useCallback } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import type { Warehouse } from '@/types/warehouse'
import type { FormData } from './usePriceCalculatorForm'
import {
  determineTariffSystem,
  type TariffSystem,
  type SupplyDateTariffs,
} from '@/lib/tariff-system-utils'

/**
 * Callback handlers for useWarehouseFormState
 * Extracted for file size compliance (Story 74.8)
 */

interface WarehouseHandlerDeps {
  setValue: UseFormSetValue<FormData>
  setWarehouseId: (id: number | null) => void
  setSelectedWarehouse: (w: Warehouse | null) => void
  setIsLogisticsManuallySet: (v: boolean) => void
  setIsLogisticsReverseManuallySet: (v: boolean) => void
  setStorageRub: (v: number) => void
  setAcceptanceCoefficient: (v: number) => void
  setTariffSystem: (v: TariffSystem) => void
  setSupplyTariffs: (v: SupplyDateTariffs | null) => void
  warehouseId: number | null
}

export function useWarehouseHandlers(deps: WarehouseHandlerDeps) {
  const {
    setValue,
    setWarehouseId,
    setSelectedWarehouse,
    setIsLogisticsManuallySet,
    setIsLogisticsReverseManuallySet,
    setStorageRub,
    setAcceptanceCoefficient,
    setTariffSystem,
    setSupplyTariffs,
    warehouseId,
  } = deps

  const handleWarehouseChange = useCallback(
    (id: number | null, warehouse: Warehouse | null) => {
      setWarehouseId(id)
      setSelectedWarehouse(warehouse)
      setIsLogisticsManuallySet(false)
      setValue('warehouse_id', id)
      setValue('warehouse_name', warehouse?.name ?? null)
    },
    [setValue, setWarehouseId, setSelectedWarehouse, setIsLogisticsManuallySet]
  )

  const setWarehouseById = useCallback(
    (id: number, warehouses: Warehouse[]) => {
      const warehouse = warehouses.find(w => w.id === id) ?? null
      if (warehouse) {
        console.info('[useWarehouseFormState] setWarehouseById: restoring', {
          id,
          name: warehouse.name,
        })
        handleWarehouseChange(id, warehouse)
      }
    },
    [handleWarehouseChange]
  )

  const handleStorageRubChange = useCallback(
    (value: number) => {
      setStorageRub(value)
      setValue('storage_rub', value)
    },
    [setValue, setStorageRub]
  )

  const handleLogisticsForwardChange = useCallback(
    (value: number) => {
      setIsLogisticsManuallySet(true)
      setValue('logistics_forward_rub', value)
    },
    [setValue, setIsLogisticsManuallySet]
  )

  const handleLogisticsReverseChange = useCallback(
    (value: number) => {
      setIsLogisticsReverseManuallySet(true)
      setValue('logistics_reverse_rub', value)
    },
    [setValue, setIsLogisticsReverseManuallySet]
  )

  const handleDeliveryDateChange = useCallback(
    (date: string | null, coefficient: number, supplyData?: SupplyDateTariffs) => {
      setValue('delivery_date', date)
      setValue('logistics_coefficient', coefficient)
      setAcceptanceCoefficient(coefficient)
      const newSystem = determineTariffSystem(date)
      console.info('[useWarehouseFormState] handleDeliveryDateChange:', {
        date,
        newSystem,
        hasSupplyData: !!supplyData,
      })
      setTariffSystem(newSystem)
      if (newSystem === 'supply' && supplyData) {
        setSupplyTariffs(supplyData)
      } else {
        setSupplyTariffs(null)
      }
    },
    [setValue, setAcceptanceCoefficient, setTariffSystem, setSupplyTariffs]
  )

  const getWarehouseForApi = useCallback(
    (warehouses: Warehouse[]) => {
      if (!warehouseId) return null
      return warehouses.find(w => w.id === warehouseId) || null
    },
    [warehouseId]
  )

  return {
    handleWarehouseChange,
    setWarehouseById,
    handleStorageRubChange,
    handleLogisticsForwardChange,
    handleLogisticsReverseChange,
    handleDeliveryDateChange,
    getWarehouseForApi,
  }
}
