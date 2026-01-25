/**
 * useWarehouseCoefficients Hook
 * Story 44.13-FE: Coefficient state management for WarehouseSection
 * Story 44.26a-FE: Delivery date selection
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Uses coefficients embedded in warehouse data from /v1/tariffs/warehouses-with-tariffs.
 * Falls back to acceptance coefficients API for daily coefficient calendar.
 *
 * IMPORTANT: Warehouse IDs between endpoints differ!
 * - /v1/tariffs/warehouses-with-tariffs uses tariff DB IDs
 * - /v1/tariffs/acceptance/coefficients uses OrdersFBW API IDs
 * Solution: Use /all endpoint and match by warehouse NAME
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAllAcceptanceCoefficients, findCoefficientsByName } from './useAllAcceptanceCoefficients'
import type { BoxTypeCoefficients, DailyCoefficient, NormalizedCoefficients } from './useAcceptanceCoefficients'
import { BOX_TYPE_CONFIG } from './useAcceptanceCoefficients'
import { getCoefficientStatus, getTomorrowDate, type NormalizedCoefficient } from '@/lib/coefficient-utils'
import type { FieldSource } from '@/components/custom/price-calculator/AutoFillBadge'
import type { Warehouse } from '@/types/warehouse'

/** Coefficient field state with auto/manual tracking */
export interface CoefficientState {
  value: number
  source: FieldSource
  originalValue?: number
}

/** Delivery date state */
export interface DeliveryDateState {
  date: string | null
  coefficient: number
}

export interface UseWarehouseCoefficientsResult {
  /** Loading state for coefficients */
  isLoading: boolean
  /** Error from API */
  error: Error | null
  /** Logistics coefficient state */
  logisticsCoeff: CoefficientState
  /** Storage coefficient state */
  storageCoeff: CoefficientState
  /** Update logistics coefficient */
  setLogisticsValue: (value: number) => void
  /** Update storage coefficient */
  setStorageValue: (value: number) => void
  /** Restore logistics to original */
  restoreLogistics: () => void
  /** Restore storage to original */
  restoreStorage: () => void
  /** Daily coefficients for calendar (default box type) */
  dailyCoefficients: NormalizedCoefficient[]
  /** Coefficients grouped by box type (Boxes, Pallets, Supersafe) */
  byBoxType: BoxTypeCoefficients[]
  /** Delivery date state */
  deliveryDate: DeliveryDateState
  /** Update delivery date */
  setDeliveryDate: (date: string, coefficient: number) => void
  /** Story 44.34: Currently debouncing warehouse changes */
  isDebouncing: boolean
  /** Story 44.34: Rate limited by backend (429 error) */
  isRateLimited: boolean
  /** Story 44.34: Remaining cooldown seconds if rate limited */
  cooldownRemaining: number
}

/** Get BoxType key from boxTypeId */
function getBoxTypeKey(boxTypeId: number): 'boxes' | 'pallets' | 'supersafe' {
  switch (boxTypeId) {
    case 2: return 'boxes'
    case 5: return 'pallets'
    case 6: return 'supersafe'
    default: return 'boxes'
  }
}

/** Normalize coefficient from API */
function normalizeCoefficient(rawCoeff: number): number {
  if (rawCoeff < 0) return 0
  return rawCoeff > 10 ? rawCoeff / 100 : rawCoeff
}

/**
 * Hook to manage warehouse coefficient state
 * Features:
 * - Auto-fill coefficients from warehouse data (embedded in warehouses-with-tariffs)
 * - Track auto/manual source for each coefficient
 * - Restore functionality for edited values
 * - Delivery date selection with calendar support (from acceptance API)
 * - Matches warehouse by NAME to resolve ID mismatch between endpoints
 *
 * @param warehouseId - Warehouse ID (from tariff DB)
 * @param warehouse - Warehouse object with embedded coefficients and name
 */
export function useWarehouseCoefficients(
  warehouseId: number | null,
  warehouse?: Warehouse | null,
): UseWarehouseCoefficientsResult {
  // Fetch ALL acceptance coefficients from /all endpoint
  // Then match by warehouse NAME (IDs differ between endpoints)
  const {
    data: allCoefficients,
    isLoading,
    error,
  } = useAllAcceptanceCoefficients()

  // Find coefficients for this warehouse by name (fuzzy matching)
  const coefficients: NormalizedCoefficients | null = useMemo(() => {
    if (!warehouse?.name || !allCoefficients) return null

    const warehouseData = findCoefficientsByName(allCoefficients, warehouse.name)
    if (!warehouseData || warehouseData.coefficients.length === 0) {
      // No acceptance data found - coefficients will come from embedded warehouse data
      return null
    }

    const coeffs = warehouseData.coefficients
    const firstCoeff = coeffs[0]

    // Group by box type
    const byBoxTypeMap = new Map<'boxes' | 'pallets' | 'supersafe', DailyCoefficient[]>()
    for (const c of coeffs) {
      const boxType = getBoxTypeKey(c.boxTypeId)
      const daily: DailyCoefficient = {
        date: c.date.split('T')[0],
        coefficient: normalizeCoefficient(c.coefficient),
        isAvailable: c.isAvailable,
      }
      if (!byBoxTypeMap.has(boxType)) {
        byBoxTypeMap.set(boxType, [])
      }
      byBoxTypeMap.get(boxType)!.push(daily)
    }

    // Convert to array
    const byBoxType: BoxTypeCoefficients[] = []
    for (const [boxType, dailyCoeffs] of byBoxTypeMap) {
      const config = BOX_TYPE_CONFIG[boxType]
      dailyCoeffs.sort((a, b) => a.date.localeCompare(b.date))
      byBoxType.push({
        boxType,
        boxTypeId: config.id,
        label: config.label,
        dailyCoefficients: dailyCoeffs,
      })
    }
    byBoxType.sort((a, b) => a.boxTypeId - b.boxTypeId)

    // Default to boxes for legacy dailyCoefficients
    const boxesCoeffs = byBoxTypeMap.get('boxes') || []
    const availableCoeffs = boxesCoeffs.filter((c) => c.coefficient > 0)
    const avgCoeff = availableCoeffs.length > 0
      ? availableCoeffs.reduce((sum, c) => sum + c.coefficient, 0) / availableCoeffs.length
      : 1.0
    const todayCoeff = boxesCoeffs[0]?.coefficient ?? 1.0

    return {
      warehouseId: warehouseData.warehouseId,
      warehouseName: warehouseData.warehouseName,
      todayCoefficient: todayCoeff,
      averageCoefficient: avgCoeff,
      dailyCoefficients: boxesCoeffs,
      byBoxType,
      delivery: {
        baseLiterRub: firstCoeff.delivery.baseLiterRub,
        additionalLiterRub: firstCoeff.delivery.additionalLiterRub,
        coefficient: normalizeCoefficient(firstCoeff.delivery.coefficient),
      },
      storage: {
        baseLiterRub: firstCoeff.storage.baseLiterRub,
        additionalLiterRub: firstCoeff.storage.additionalLiterRub,
        coefficient: normalizeCoefficient(firstCoeff.storage.coefficient),
      },
    }
  }, [warehouse?.name, allCoefficients])

  // Story 44.34: No per-warehouse debouncing needed anymore (using /all)
  const isDebouncing = false
  const isRateLimited = false
  const cooldownRemaining = 0

  // Coefficient states
  const [logisticsCoeff, setLogisticsCoeff] = useState<CoefficientState>({
    value: 1.0,
    source: 'manual',
  })
  const [storageCoeff, setStorageCoeff] = useState<CoefficientState>({
    value: 1.0,
    source: 'manual',
  })

  // Delivery date state
  const [deliveryDate, setDeliveryDateState] = useState<DeliveryDateState>({
    date: null,
    coefficient: 1.0,
  })

  // Auto-fill coefficients from warehouse data or acceptance API
  useEffect(() => {
    const hasEmbeddedCoefficients = warehouse?.tariffs?.logisticsCoefficient !== undefined

    if (hasEmbeddedCoefficients) {
      // Primary: use embedded coefficients from warehouse data
      const logCoeff = warehouse.tariffs.logisticsCoefficient!
      const storCoeff = warehouse.tariffs.storageCoefficient ?? 1.0
      console.info('[Coefficients] Using embedded coefficients for', warehouse.name, {
        logistics: logCoeff,
        storage: storCoeff,
      })
      setLogisticsCoeff({
        value: logCoeff,
        source: 'auto',
        originalValue: logCoeff,
      })
      setStorageCoeff({
        value: storCoeff,
        source: 'auto',
        originalValue: storCoeff,
      })
      // Set tomorrow as default date
      const tomorrow = getTomorrowDate()
      setDeliveryDateState({ date: tomorrow, coefficient: logCoeff })
    } else if (coefficients) {
      // Fallback: use acceptance coefficients API data
      setLogisticsCoeff({
        value: coefficients.delivery.coefficient,
        source: 'auto',
        originalValue: coefficients.delivery.coefficient,
      })
      setStorageCoeff({
        value: coefficients.storage.coefficient,
        source: 'auto',
        originalValue: coefficients.storage.coefficient,
      })
    }

    // Use daily coefficients for calendar (from acceptance API)
    if (coefficients?.dailyCoefficients?.length) {
      const tomorrow = getTomorrowDate()
      const tomorrowCoeff = coefficients.dailyCoefficients.find((c) => c.date === tomorrow)
      if (tomorrowCoeff && tomorrowCoeff.isAvailable) {
        setDeliveryDateState({ date: tomorrow, coefficient: tomorrowCoeff.coefficient })
      } else {
        const firstAvailable = coefficients.dailyCoefficients.find((c) => c.isAvailable)
        if (firstAvailable) {
          setDeliveryDateState({ date: firstAvailable.date, coefficient: firstAvailable.coefficient })
        }
      }
    }
  }, [warehouse, coefficients])

  // Reset when warehouse cleared
  useEffect(() => {
    if (!warehouseId) {
      setLogisticsCoeff({ value: 1.0, source: 'manual' })
      setStorageCoeff({ value: 1.0, source: 'manual' })
      setDeliveryDateState({ date: null, coefficient: 1.0 })
    }
  }, [warehouseId])

  // Transform daily coefficients to NormalizedCoefficient format
  // Use isAvailable flag for unavailable status (original coefficient is normalized)
  const dailyCoefficients: NormalizedCoefficient[] = useMemo(() => {
    if (!coefficients?.dailyCoefficients) return []
    return coefficients.dailyCoefficients.map((c) => ({
      date: c.date,
      coefficient: c.coefficient,
      status: !c.isAvailable ? 'unavailable' : getCoefficientStatus(c.coefficient),
      isAvailable: c.isAvailable,
    }))
  }, [coefficients])

  // Get coefficients grouped by box type
  const byBoxType: BoxTypeCoefficients[] = useMemo(() => {
    return coefficients?.byBoxType ?? []
  }, [coefficients])

  // Setters
  const setLogisticsValue = useCallback((value: number) => {
    setLogisticsCoeff((prev) => ({ ...prev, value, source: 'manual' as FieldSource }))
  }, [])

  const setStorageValue = useCallback((value: number) => {
    setStorageCoeff((prev) => ({ ...prev, value, source: 'manual' as FieldSource }))
  }, [])

  const restoreLogistics = useCallback(() => {
    if (logisticsCoeff.originalValue !== undefined) {
      setLogisticsCoeff({
        value: logisticsCoeff.originalValue,
        source: 'auto',
        originalValue: logisticsCoeff.originalValue,
      })
    }
  }, [logisticsCoeff.originalValue])

  const restoreStorage = useCallback(() => {
    if (storageCoeff.originalValue !== undefined) {
      setStorageCoeff({
        value: storageCoeff.originalValue,
        source: 'auto',
        originalValue: storageCoeff.originalValue,
      })
    }
  }, [storageCoeff.originalValue])

  const setDeliveryDate = useCallback((date: string, coefficient: number) => {
    setDeliveryDateState({ date, coefficient })
  }, [])

  return {
    isLoading,
    error: error as Error | null,
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
  }
}
