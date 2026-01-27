import { useState, useMemo, useCallback, useEffect } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import type { Warehouse } from '@/types/warehouse'
import type { FormData } from './usePriceCalculatorForm'
import { calculateDailyStorageCost } from '@/lib/storage-cost-utils'
import { calculateLogisticsTariff, calculateReturnLogistics, type BoxDeliveryTariffs } from '@/lib/logistics-tariff'
import {
  calculateAcceptanceCost,
  DEFAULT_ACCEPTANCE_TARIFF,
  type AcceptanceTariff,
  type AcceptanceCostResult,
} from '@/lib/acceptance-cost-utils'
import type { BoxTypeId } from '@/lib/box-type-utils'
import {
  determineTariffSystem,
  extractTariffs,
  type TariffSystem,
  type SupplyDateTariffs,
  type ExtractedTariffs,
} from '@/lib/tariff-system-utils'

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
  /** Delivery box type ID: 2=Boxes, 5=Pallets, 6=Supersafe */
  boxType: BoxTypeId
  /** Number of units per package (for per-unit cost calculation) */
  unitsPerPackage: number
  /** Optional acceptance tariff from admin settings */
  acceptanceTariff?: AcceptanceTariff
  /** Initial warehouse ID from preset (selected after warehouses load) */
  initialWarehouseId?: number | null
}

export interface UseWarehouseFormStateReturn {
  warehouseId: number | null
  /** Daily storage cost per unit (RUB/day) for TurnoverDaysInput */
  dailyStorageCost: number
  /** Current storage_rub value from form */
  storageRub: number
  volumeLiters: number
  /** Calculated logistics forward cost (auto-fill) */
  logisticsForwardRub: number
  /** Whether logistics forward was auto-filled (vs manually set) */
  isLogisticsAutoFilled: boolean
  /** Calculated logistics reverse cost (auto-fill) */
  logisticsReverseRub: number
  /** Whether logistics reverse was auto-filled (vs manually set) */
  isLogisticsReverseAutoFilled: boolean
  /** Current acceptance coefficient from delivery date selection */
  acceptanceCoefficient: number
  /** Calculated acceptance cost with formula for display */
  acceptanceCost: AcceptanceCostResult
  handleWarehouseChange: (id: number | null, warehouse: Warehouse | null) => void
  /** Set warehouse by ID from loaded warehouses list (for preset restoration) */
  setWarehouseById: (id: number, warehouses: Warehouse[]) => void
  /** Handler for TurnoverDaysInput storage_rub emission */
  handleStorageRubChange: (value: number) => void
  /** Handler for manual logistics forward override */
  handleLogisticsForwardChange: (value: number) => void
  /** Handler for manual logistics reverse override */
  handleLogisticsReverseChange: (value: number) => void
  /** Handler for delivery date change with optional supply tariffs */
  handleDeliveryDateChange: (date: string | null, coefficient: number, supplyData?: SupplyDateTariffs) => void
  // Story 44.27: Method to get warehouse object for API request
  getWarehouseForApi: (warehouses: Warehouse[]) => Warehouse | null
  // Story 44.40: Two Tariff Systems Integration
  /** Active tariff system ('inventory' for today/no date, 'supply' for future) */
  tariffSystem: TariffSystem
  /** SUPPLY tariffs for selected date (null if using INVENTORY) */
  supplyTariffs: SupplyDateTariffs | null
  /** Effective tariffs extracted from the active system */
  effectiveTariffs: ExtractedTariffs
}

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
  // Initialize with preset warehouse ID if provided
  const [warehouseId, setWarehouseId] = useState<number | null>(initialWarehouseId ?? null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [storageRub, setStorageRub] = useState(0)
  const [isLogisticsManuallySet, setIsLogisticsManuallySet] = useState(false)
  const [isLogisticsReverseManuallySet, setIsLogisticsReverseManuallySet] = useState(false)
  const [acceptanceCoefficient, setAcceptanceCoefficient] = useState(1.0)
  // Story 44.40: Two Tariff Systems state
  const [tariffSystem, setTariffSystem] = useState<TariffSystem>('inventory')
  const [supplyTariffs, setSupplyTariffs] = useState<SupplyDateTariffs | null>(null)

  // Calculate volume from dimensions (cm to liters)
  const volumeLiters = useMemo(() => {
    if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0
    return (lengthCm * widthCm * heightCm) / 1000
  }, [lengthCm, widthCm, heightCm])

  // Story 44.40: Calculate effective tariffs based on active system
  // MUST be before dailyStorageCost and logisticsForwardRub calculations
  const effectiveTariffs = useMemo(() => {
    const result = extractTariffs(tariffSystem, selectedWarehouse, supplyTariffs)
    console.info('[useWarehouseFormState] effectiveTariffs calculated:', {
      tariffSystem,
      hasSupplyTariffs: !!supplyTariffs,
      logisticsCoefficient: result.logisticsCoefficient,
      deliveryBase: result.deliveryBaseLiterRub,
      source: result.source,
    })
    return result
  }, [tariffSystem, selectedWarehouse, supplyTariffs])

  // Calculate daily storage cost from effective tariffs and volume
  // Uses effectiveTariffs to respect SUPPLY vs INVENTORY tariff system
  const dailyStorageCost = useMemo(() => {
    const tariff = {
      basePerDayRub: effectiveTariffs.storageBaseLiterRub,
      perLiterPerDayRub: effectiveTariffs.storagePerLiterRub,
      coefficient: effectiveTariffs.storageCoefficient,
    }
    return calculateDailyStorageCost(volumeLiters, tariff)
  }, [effectiveTariffs, volumeLiters])

  // Calculate logistics forward cost from effective tariffs and volume
  // Uses effectiveTariffs to respect SUPPLY vs INVENTORY tariff system
  const logisticsForwardRub = useMemo(() => {
    if (volumeLiters <= 0) return 0
    const tariff: BoxDeliveryTariffs = {
      baseLiterRub: effectiveTariffs.deliveryBaseLiterRub,
      additionalLiterRub: effectiveTariffs.deliveryPerLiterRub,
      coefficient: effectiveTariffs.logisticsCoefficient,
    }
    return calculateLogisticsTariff(volumeLiters, tariff).totalCost
  }, [effectiveTariffs, volumeLiters])

  // Calculate return logistics cost from volume
  // Formula: 50 RUB base + 25 RUB per additional liter
  const logisticsReverseRub = useMemo(() => {
    return calculateReturnLogistics(volumeLiters)
  }, [volumeLiters])

  // Story 44.XX: Calculate acceptance cost from tariff, dimensions, and coefficient
  const acceptanceCost = useMemo(() => {
    const tariff = acceptanceTariff ?? DEFAULT_ACCEPTANCE_TARIFF
    const effectiveUnits = unitsPerPackage > 0 ? unitsPerPackage : 1
    return calculateAcceptanceCost(boxType, volumeLiters, acceptanceCoefficient, effectiveUnits, tariff)
  }, [boxType, volumeLiters, acceptanceCoefficient, unitsPerPackage, acceptanceTariff])

  // Auto-fill logistics_forward_rub when calculated value changes
  useEffect(() => {
    if (!isLogisticsManuallySet && logisticsForwardRub > 0) {
      setValue('logistics_forward_rub', logisticsForwardRub)
    }
  }, [logisticsForwardRub, isLogisticsManuallySet, setValue])

  // Auto-fill logistics_reverse_rub when calculated value changes
  useEffect(() => {
    if (!isLogisticsReverseManuallySet && logisticsReverseRub > 0) {
      setValue('logistics_reverse_rub', logisticsReverseRub)
    }
  }, [logisticsReverseRub, isLogisticsReverseManuallySet, setValue])

  const handleWarehouseChange = useCallback(
    (id: number | null, warehouse: Warehouse | null) => {
      setWarehouseId(id)
      setSelectedWarehouse(warehouse)
      setIsLogisticsManuallySet(false) // Reset manual flag to allow auto-fill
      setValue('warehouse_id', id)
      setValue('warehouse_name', warehouse?.name ?? null)
    },
    [setValue],
  )

  /** Set warehouse by ID from loaded warehouses list (for preset restoration) */
  const setWarehouseById = useCallback(
    (id: number, warehouses: Warehouse[]) => {
      const warehouse = warehouses.find(w => w.id === id) ?? null
      if (warehouse) {
        console.info('[useWarehouseFormState] setWarehouseById: restoring warehouse from preset', { id, name: warehouse.name })
        handleWarehouseChange(id, warehouse)
      }
    },
    [handleWarehouseChange],
  )

  // Handler for TurnoverDaysInput to emit calculated storage_rub
  const handleStorageRubChange = useCallback(
    (value: number) => {
      setStorageRub(value)
      setValue('storage_rub', value)
    },
    [setValue],
  )

  // Handler for manual logistics forward override
  const handleLogisticsForwardChange = useCallback(
    (value: number) => {
      setIsLogisticsManuallySet(true)
      setValue('logistics_forward_rub', value)
    },
    [setValue],
  )

  // Handler for manual logistics reverse override
  const handleLogisticsReverseChange = useCallback(
    (value: number) => {
      setIsLogisticsReverseManuallySet(true)
      setValue('logistics_reverse_rub', value)
    },
    [setValue],
  )

  const handleDeliveryDateChange = useCallback(
    (date: string | null, coefficient: number, supplyData?: SupplyDateTariffs) => {
      setValue('delivery_date', date)
      setValue('logistics_coefficient', coefficient)
      // Story 44.XX: Update acceptance coefficient for cost calculation
      setAcceptanceCoefficient(coefficient)

      // Story 44.40: Determine tariff system based on date
      const newSystem = determineTariffSystem(date)
      console.info('[useWarehouseFormState] handleDeliveryDateChange:', {
        date,
        newSystem,
        hasSupplyData: !!supplyData,
      })
      setTariffSystem(newSystem)

      // Store supply tariffs if provided and using supply system
      if (newSystem === 'supply' && supplyData) {
        setSupplyTariffs(supplyData)
      } else {
        setSupplyTariffs(null)
      }
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
    logisticsForwardRub,
    isLogisticsAutoFilled: !isLogisticsManuallySet && logisticsForwardRub > 0,
    logisticsReverseRub,
    isLogisticsReverseAutoFilled: !isLogisticsReverseManuallySet && logisticsReverseRub > 0,
    acceptanceCoefficient,
    acceptanceCost,
    handleWarehouseChange,
    setWarehouseById,
    handleStorageRubChange,
    handleLogisticsForwardChange,
    handleLogisticsReverseChange,
    handleDeliveryDateChange,
    getWarehouseForApi,
    // Story 44.40: Two Tariff Systems
    tariffSystem,
    supplyTariffs,
    effectiveTariffs,
  }
}
