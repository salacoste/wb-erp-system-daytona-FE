'use client'

/**
 * useWarehouseCoefficients Hook (Epic 44, Stories 44.13/44.26a)
 * Types in warehouse-coefficient-types.ts, helpers in warehouse-coefficient-helpers.ts (Epic 74).
 * IMPORTANT: Warehouse IDs differ between endpoints — match by NAME via /all endpoint.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  useAllAcceptanceCoefficients,
  findCoefficientsByName,
} from './useAllAcceptanceCoefficients'
import type { BoxTypeCoefficients, NormalizedCoefficients } from './useAcceptanceCoefficients'
import { getCoefficientStatus, type NormalizedCoefficient } from '@/lib/coefficient-utils'
import type { FieldSource } from '@/components/custom/price-calculator/AutoFillBadge'
import type { Warehouse } from '@/types/warehouse'
import type {
  CoefficientState,
  DeliveryDateState,
  UseWarehouseCoefficientsResult,
} from './warehouse-coefficient-types'
import { buildNormalizedCoefficients } from './warehouse-coefficient-helpers'
import { computeAutoFillState } from './use-coefficient-auto-fill'

// Re-export types for backward compatibility
export type {
  CoefficientState,
  DeliveryDateState,
  UseWarehouseCoefficientsResult,
} from './warehouse-coefficient-types'

/**
 * Hook to manage warehouse coefficient state
 *
 * @param warehouseId - Warehouse ID (from tariff DB)
 * @param warehouse - Warehouse object with embedded coefficients and name
 */
export function useWarehouseCoefficients(
  warehouseId: number | null,
  warehouse?: Warehouse | null
): UseWarehouseCoefficientsResult {
  const { data: allCoefficients, isLoading, error } = useAllAcceptanceCoefficients()

  // Find coefficients for this warehouse by name (fuzzy matching)
  const coefficients: NormalizedCoefficients | null = useMemo(() => {
    if (!warehouse?.name || !allCoefficients) return null

    const warehouseData = findCoefficientsByName(allCoefficients, warehouse.name)
    if (!warehouseData || warehouseData.coefficients.length === 0) {
      return null
    }

    return buildNormalizedCoefficients(warehouseData)
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
  const [deliveryDate, setDeliveryDateState] = useState<DeliveryDateState>({
    date: null,
    coefficient: 1.0,
  })

  // Auto-fill coefficients from warehouse data or acceptance API
  useEffect(() => {
    const { logistics, storage, delivery } = computeAutoFillState(warehouse, coefficients)
    setLogisticsCoeff(logistics)
    setStorageCoeff(storage)
    setDeliveryDateState(delivery)
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
    return coefficients.dailyCoefficients.map(c => ({
      date: c.date,
      coefficient: c.coefficient,
      status: !c.isAvailable ? 'unavailable' : getCoefficientStatus(c.coefficient),
      isAvailable: c.isAvailable,
    }))
  }, [coefficients])

  const byBoxType: BoxTypeCoefficients[] = useMemo(() => {
    return coefficients?.byBoxType ?? []
  }, [coefficients])

  const setLogisticsValue = useCallback((value: number) => {
    setLogisticsCoeff(prev => ({ ...prev, value, source: 'manual' as FieldSource }))
  }, [])

  const setStorageValue = useCallback((value: number) => {
    setStorageCoeff(prev => ({ ...prev, value, source: 'manual' as FieldSource }))
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
    isDebouncing,
    isRateLimited,
    cooldownRemaining,
  }
}
