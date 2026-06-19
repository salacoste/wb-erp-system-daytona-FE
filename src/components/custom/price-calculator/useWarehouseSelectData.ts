'use client'

import { useMemo } from 'react'
import { useWarehouses } from '@/hooks/useWarehouses'
import { useSupplyTariffs, type SupplyWarehouse } from '@/hooks/useSupplyTariffs'
import type { Warehouse } from '@/types/warehouse'

/**
 * Data layer for WarehouseSelect - fetches and converts warehouse sources
 * Extracted from WarehouseSelect for file size compliance (Story 74.8)
 */
export function useWarehouseSelectData(useSupplySource: boolean) {
  const inventoryQuery = useWarehouses()
  const supplyQuery = useSupplyTariffs()

  // Convert SupplyWarehouse[] to Warehouse[] with tariffs from SUPPLY coefficients
  // CRITICAL: Use calculation coefficients (1.0) since rates are pre-multiplied
  // @see docs/request-backend/108-two-tariff-systems-guide.md
  const supplyWarehouses = useMemo((): Warehouse[] => {
    return supplyQuery.warehouses.map((sw: SupplyWarehouse) => ({
      id: sw.id,
      name: sw.name,
      tariffs: {
        deliveryBaseLiterRub: sw.tariffs.deliveryBaseLiterRub,
        deliveryPerLiterRub: sw.tariffs.deliveryPerLiterRub,
        storageBaseLiterRub: sw.tariffs.storageBaseLiterRub,
        storagePerLiterRub: sw.tariffs.storagePerLiterRub,
        logisticsCoefficient: sw.tariffs.logisticsCoefficient,
        storageCoefficient: sw.tariffs.storageCoefficient,
        usingStorageFallback: sw.tariffs.usingStorageFallback,
      },
    }))
  }, [supplyQuery.warehouses])

  const warehouses = useSupplySource ? supplyWarehouses : inventoryQuery.data
  const isLoading = useSupplySource ? supplyQuery.isLoading : inventoryQuery.isLoading
  const isError = useSupplySource ? !!supplyQuery.error : inventoryQuery.isError
  const refetch = useSupplySource ? () => {} : inventoryQuery.refetch

  return {
    warehouses,
    isLoading,
    isError,
    refetch,
    supplyQuery,
  }
}
