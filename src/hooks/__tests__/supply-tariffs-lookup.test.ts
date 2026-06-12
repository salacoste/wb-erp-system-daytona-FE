import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger } from '@/lib/logger'
import { extractSupplyWarehouses } from '../supply-tariffs-lookup'
import type { AcceptanceCoefficient } from '@/types/tariffs'

const coeff = (warehouseId: number, baseLiterRub: number): AcceptanceCoefficient =>
  ({
    warehouseId,
    warehouseName: `Warehouse ${warehouseId}`,
    boxTypeId: 2,
    boxTypeName: 'Короба',
    date: '2026-06-12',
    coefficient: 1,
    delivery: { baseLiterRub: 46, additionalLiterRub: 14, coefficient: 1 },
    storage: { baseLiterRub, additionalLiterRub: 0.05, coefficient: 1 },
  }) as AcceptanceCoefficient

describe('extractSupplyWarehouses fallback warning policy', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
  })

  it('emits one summarized warning per extraction when many warehouses use fallback', () => {
    const warehouses = extractSupplyWarehouses([coeff(1, 0), coeff(2, 0), coeff(3, 0.08)])

    expect(warehouses).toHaveLength(3)
    expect(warehouses.filter(w => w.tariffs.usingStorageFallback)).toHaveLength(2)
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      '[StorageTariffs] 2 warehouse(s) using fallback storage tariffs for this calculation',
      {
        sample: [
          { warehouseId: 1, warehouseName: 'Warehouse 1' },
          { warehouseId: 2, warehouseName: 'Warehouse 2' },
        ],
      }
    )
  })

  it('logs again for a later extraction cycle', () => {
    extractSupplyWarehouses([coeff(1, 0)])
    extractSupplyWarehouses([coeff(1, 0)])

    expect(logger.warn).toHaveBeenCalledTimes(2)
  })
})
