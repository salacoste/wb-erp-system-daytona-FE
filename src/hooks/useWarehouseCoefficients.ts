/**
 * useWarehouseCoefficients Hook
 * Story 44.13-FE: Coefficient state management for WarehouseSection
 * Story 44.26a-FE: Delivery date selection
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Uses coefficients embedded in warehouse data from /v1/tariffs/warehouses-with-tariffs.
 * Falls back to acceptance coefficients API for daily coefficient calendar.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAcceptanceCoefficients, type BoxTypeCoefficients } from './useAcceptanceCoefficients'
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
}

/**
 * Hook to manage warehouse coefficient state
 * Features:
 * - Auto-fill coefficients from warehouse data (embedded in warehouses-with-tariffs)
 * - Track auto/manual source for each coefficient
 * - Restore functionality for edited values
 * - Delivery date selection with calendar support (from acceptance API)
 *
 * @param warehouseId - Warehouse ID
 * @param warehouse - Warehouse object with embedded coefficients
 */
export function useWarehouseCoefficients(
  warehouseId: number | null,
  warehouse?: Warehouse | null,
): UseWarehouseCoefficientsResult {
  // Acceptance API for daily coefficients calendar (optional, may fail for synthetic IDs)
  const { data: coefficients, isLoading, error } = useAcceptanceCoefficients(warehouseId)

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
  const dailyCoefficients: NormalizedCoefficient[] = useMemo(() => {
    if (!coefficients?.dailyCoefficients) return []
    return coefficients.dailyCoefficients.map((c) => ({
      date: c.date,
      coefficient: c.coefficient,
      status: getCoefficientStatus(c.coefficient),
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
  }
}
