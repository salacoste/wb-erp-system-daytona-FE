import { useState, useMemo, useEffect } from 'react'
import type { Warehouse } from '@/types/warehouse'
import {
  extractTariffs,
  type TariffSystem,
  type SupplyDateTariffs,
} from '@/lib/tariff-system-utils'
import type {
  UseWarehouseFormStateProps,
  UseWarehouseFormStateReturn,
} from './warehouse-form-types'
import {
  calculateVolumeLiters,
  calculateDailyStorage,
  calculateLogisticsForward,
  calculateLogisticsReverse,
  calculateAcceptance,
} from './warehouse-form-calculations'
import { useWarehouseHandlers } from './warehouse-form-handlers'

/**
 * Hook for managing warehouse-related form state
 * Story 44.27-FE: Warehouse & Coefficients Integration
 * Story 44.XX: Simplified storage - dailyStorageCost for TurnoverDaysInput
 */
export type { UseWarehouseFormStateProps, UseWarehouseFormStateReturn }

export function useWarehouseFormState({
  setValue,
  lengthCm,
  widthCm,
  heightCm,
  boxType,
  unitsPerPackage,
  acceptanceTariff,
  initialWarehouseId,
}: UseWarehouseFormStateProps): UseWarehouseFormStateReturn {
  const [warehouseId, setWarehouseId] = useState<number | null>(initialWarehouseId ?? null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [storageRub, setStorageRub] = useState(0)
  const [isLogisticsManuallySet, setIsLogisticsManuallySet] = useState(false)
  const [isLogisticsReverseManuallySet, setIsLogisticsReverseManuallySet] = useState(false)
  const [acceptanceCoefficient, setAcceptanceCoefficient] = useState(1.0)
  const [tariffSystem, setTariffSystem] = useState<TariffSystem>('inventory')
  const [supplyTariffs, setSupplyTariffs] = useState<SupplyDateTariffs | null>(null)

  // Story 44.44: Sync warehouseId when initialWarehouseId changes
  useEffect(() => {
    if (initialWarehouseId && warehouseId !== initialWarehouseId) {
      console.info('[useWarehouseFormState] Syncing warehouseId from preset:', initialWarehouseId)
      setWarehouseId(initialWarehouseId)
    }
  }, [initialWarehouseId, warehouseId])

  const volumeLiters = useMemo(
    () => calculateVolumeLiters(lengthCm, widthCm, heightCm),
    [lengthCm, widthCm, heightCm]
  )

  // Story 44.40: Effective tariffs from active system (MUST be before cost calculations)
  const effectiveTariffs = useMemo(() => {
    const result = extractTariffs(tariffSystem, selectedWarehouse, supplyTariffs)
    console.info('[useWarehouseFormState] effectiveTariffs:', {
      tariffSystem,
      hasSupplyTariffs: !!supplyTariffs,
      logisticsCoefficient: result.logisticsCoefficient,
      source: result.source,
    })
    return result
  }, [tariffSystem, selectedWarehouse, supplyTariffs])

  const dailyStorageCost = useMemo(
    () => calculateDailyStorage(effectiveTariffs, volumeLiters),
    [effectiveTariffs, volumeLiters]
  )
  const logisticsForwardRub = useMemo(
    () => calculateLogisticsForward(effectiveTariffs, volumeLiters),
    [effectiveTariffs, volumeLiters]
  )
  const logisticsReverseRub = useMemo(() => calculateLogisticsReverse(volumeLiters), [volumeLiters])
  const acceptanceCost = useMemo(
    () =>
      calculateAcceptance(
        boxType,
        volumeLiters,
        acceptanceCoefficient,
        unitsPerPackage,
        acceptanceTariff
      ),
    [boxType, volumeLiters, acceptanceCoefficient, unitsPerPackage, acceptanceTariff]
  )

  // Auto-fill logistics when calculated value changes
  useEffect(() => {
    if (!isLogisticsManuallySet && logisticsForwardRub > 0)
      setValue('logistics_forward_rub', logisticsForwardRub)
  }, [logisticsForwardRub, isLogisticsManuallySet, setValue])
  useEffect(() => {
    if (!isLogisticsReverseManuallySet && logisticsReverseRub > 0)
      setValue('logistics_reverse_rub', logisticsReverseRub)
  }, [logisticsReverseRub, isLogisticsReverseManuallySet, setValue])

  const handlers = useWarehouseHandlers({
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
  })

  return {
    warehouseId,
    dailyStorageCost,
    storageRub,
    volumeLiters,
    logisticsForwardRub,
    isLogisticsAutoFilled: !isLogisticsManuallySet && logisticsForwardRub > 0,
    logisticsReverseRub,
    isLogisticsReverseAutoFilled: !isLogisticsReverseManuallySet && logisticsReverseRub > 0,
    acceptanceCoefficient,
    acceptanceCost,
    ...handlers,
    tariffSystem,
    supplyTariffs,
    effectiveTariffs,
  }
}
