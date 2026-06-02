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
 * Simplified storage - dailyStorageCost for TurnoverDaysInput
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
      setWarehouseId(initialWarehouseId)
    }
  }, [initialWarehouseId, warehouseId])

  const volumeLiters = useMemo(
    () => calculateVolumeLiters(lengthCm, widthCm, heightCm),
    [lengthCm, widthCm, heightCm]
  )

  // Story 44.40: Effective tariffs from active system (MUST be before cost calculations)
  const effectiveTariffs = useMemo(() => {
    return extractTariffs(tariffSystem, selectedWarehouse, supplyTariffs)
  }, [tariffSystem, selectedWarehouse, supplyTariffs])

  const dailyStorageCost = useMemo(
    // price-calc DEFECT-1: thread boxType so Pallets (5) use the fixed volume-independent storage
    // formula (was defaulting to Boxes → overstated pallet storage > 1 L, inflating the price).
    () => calculateDailyStorage(effectiveTariffs, volumeLiters, boxType),
    [effectiveTariffs, volumeLiters, boxType]
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

  // price-calc DEFECT-2 (iter-57): auto-fill forward logistics whenever a warehouse is
  // selected and the volume is known — applying the computed value INCLUDING a legitimate 0.
  // FBS "Маркетплейс" warehouses have a real FBO logistics rate of 0; the old
  // `logisticsForwardRub > 0` guard dropped that 0, leaving a stale rate from a previously
  // selected FBO warehouse on the form (selection-order-dependent wrong logistics). Gating on
  // `selectedWarehouse && volumeLiters > 0` keeps auto-fill suppressed until both exist, then
  // writes the correct value (0 for FBS). calculateLogisticsForward already returns 0 when
  // volumeLiters <= 0, so volume is the right "is there anything to apply" signal.
  const isLogisticsAutoFillable =
    !isLogisticsManuallySet && selectedWarehouse !== null && volumeLiters > 0

  useEffect(() => {
    if (isLogisticsAutoFillable) setValue('logistics_forward_rub', logisticsForwardRub)
  }, [isLogisticsAutoFillable, logisticsForwardRub, setValue])
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
    // True even when the auto-filled value is a legitimate 0 (FBS warehouse) — the field WAS
    // auto-filled, so the UI badge should reflect that (DEFECT-2).
    isLogisticsAutoFilled: isLogisticsAutoFillable,
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
