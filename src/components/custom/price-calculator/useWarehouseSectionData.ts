'use client'

import { useMemo } from 'react'
import { useSupplyTariffs } from '@/hooks/useSupplyTariffs'
import type { SupplyDateTariffs } from '@/lib/tariff-system-utils'

/**
 * Supply tariffs map builder for WarehouseSection
 * Extracted from WarehouseSection for file size compliance (Story 74.8)
 *
 * Story 44.40: Creates map of date -> SupplyDateTariffs for DeliveryDatePicker
 */
export function useSupplyTariffsMap(warehouseId: number | null) {
  const { coefficients: supplyCoefficients, findTariffsForDate } = useSupplyTariffs()

  const supplyTariffsMap = useMemo(() => {
    if (!warehouseId || !supplyCoefficients.length) return new Map<string, SupplyDateTariffs>()

    const map = new Map<string, SupplyDateTariffs>()
    supplyCoefficients
      .filter(c => c.warehouseId === warehouseId)
      .forEach(c => {
        const dateKey = c.date.split('T')[0] // Normalize to YYYY-MM-DD
        if (!map.has(dateKey)) {
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

  return { supplyTariffsMap, findTariffsForDate }
}
