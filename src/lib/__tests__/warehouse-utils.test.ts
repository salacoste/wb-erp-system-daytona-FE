/**
 * Unit Tests for warehouse-utils
 * Story 44.12-FE: Warehouse Selection Dropdown
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Tests:
 * - Tariff expression parsing
 * - Warehouse data transformation
 * - Filtering by name and ID
 * - Popular warehouse separation
 */

import { describe, it, expect } from 'vitest'
import {
  parseTariffExpression,
  parseWarehouse,
  parseWarehouses,
  filterWarehouses,
  isPopularWarehouse,
  separateWarehouses,
} from '../warehouse-utils'
import type { RawWarehouse, Warehouse } from '@/types/warehouse'

// Test fixtures - raw warehouse data as returned from WB API
const createRawWarehouse = (
  id: number,
  name: string,
  deliveryBase = '48*1',
  deliveryLiter = '5*x',
  storageBase = '1*1',
  storageLiter = '1*x',
): RawWarehouse => ({
  warehouseID: id,
  warehouseName: name,
  boxDeliveryAndStorageExpr: `${deliveryBase}+${deliveryLiter}`,
  boxDeliveryBase: deliveryBase,
  boxDeliveryLiter: deliveryLiter,
  boxStorageBase: storageBase,
  boxStorageLiter: storageLiter,
})

describe('parseTariffExpression', () => {
  it('should parse integer base tariff "48*1" to 48', () => {
    expect(parseTariffExpression('48*1')).toBe(48)
  })

  it('should parse per-liter tariff "5*x" to 5', () => {
    expect(parseTariffExpression('5*x')).toBe(5)
  })

  it('should parse zero tariff "0*1" to 0', () => {
    expect(parseTariffExpression('0*1')).toBe(0)
  })

  it('should parse decimal tariff "3.5*x" to 3.5', () => {
    expect(parseTariffExpression('3.5*x')).toBe(3.5)
  })

  it('should parse large number "123*1" to 123', () => {
    expect(parseTariffExpression('123*1')).toBe(123)
  })

  it('should return 0 for empty string', () => {
    expect(parseTariffExpression('')).toBe(0)
  })

  it('should return 0 for invalid format', () => {
    expect(parseTariffExpression('invalid')).toBe(0)
  })

  it('should return 0 for null-like inputs', () => {
    // @ts-expect-error - testing runtime behavior with invalid input
    expect(parseTariffExpression(null)).toBe(0)
    // @ts-expect-error - testing runtime behavior with invalid input
    expect(parseTariffExpression(undefined)).toBe(0)
  })

  it('should return 0 for number input', () => {
    // @ts-expect-error - testing runtime behavior with invalid input
    expect(parseTariffExpression(48)).toBe(0)
  })
})

describe('parseWarehouse', () => {
  it('should transform raw warehouse to parsed warehouse', () => {
    const raw = createRawWarehouse(507, 'Коледино', '48*1', '5*x', '1*1', '1*x')
    const parsed = parseWarehouse(raw)

    expect(parsed.id).toBe(507)
    expect(parsed.name).toBe('Коледино')
    expect(parsed.tariffs.deliveryBaseLiterRub).toBe(48)
    expect(parsed.tariffs.deliveryPerLiterRub).toBe(5)
    expect(parsed.tariffs.storageBaseLiterRub).toBe(1)
    expect(parsed.tariffs.storagePerLiterRub).toBe(1)
  })

  it('should handle warehouse with different tariffs', () => {
    const raw = createRawWarehouse(208699, 'Казань', '43*1', '4*x', '2*1', '0.5*x')
    const parsed = parseWarehouse(raw)

    expect(parsed.id).toBe(208699)
    expect(parsed.name).toBe('Казань')
    expect(parsed.tariffs.deliveryBaseLiterRub).toBe(43)
    expect(parsed.tariffs.deliveryPerLiterRub).toBe(4)
    expect(parsed.tariffs.storageBaseLiterRub).toBe(2)
    expect(parsed.tariffs.storagePerLiterRub).toBe(0.5)
  })

  it('should handle warehouse with zero tariffs', () => {
    const raw = createRawWarehouse(100, 'Free Warehouse', '0*1', '0*x', '0*1', '0*x')
    const parsed = parseWarehouse(raw)

    expect(parsed.tariffs.deliveryBaseLiterRub).toBe(0)
    expect(parsed.tariffs.deliveryPerLiterRub).toBe(0)
    expect(parsed.tariffs.storageBaseLiterRub).toBe(0)
    expect(parsed.tariffs.storagePerLiterRub).toBe(0)
  })
})

describe('parseWarehouses', () => {
  it('should parse array of raw warehouses', () => {
    const rawList: RawWarehouse[] = [
      createRawWarehouse(507, 'Коледино'),
      createRawWarehouse(117501, 'Подольск'),
      createRawWarehouse(208699, 'Казань'),
    ]

    const parsed = parseWarehouses(rawList)

    expect(parsed).toHaveLength(3)
    expect(parsed[0].id).toBe(507)
    expect(parsed[1].id).toBe(117501)
    expect(parsed[2].id).toBe(208699)
    expect(parsed.every((w) => typeof w.tariffs.deliveryBaseLiterRub === 'number')).toBe(true)
  })

  it('should return empty array for empty input', () => {
    expect(parseWarehouses([])).toEqual([])
  })
})

describe('filterWarehouses', () => {
  const warehouses: Warehouse[] = [
    { id: 507, name: 'Коледино', tariffs: { deliveryBaseLiterRub: 48, deliveryPerLiterRub: 5, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
    { id: 117501, name: 'Подольск', tariffs: { deliveryBaseLiterRub: 45, deliveryPerLiterRub: 4, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
    { id: 208699, name: 'Казань', tariffs: { deliveryBaseLiterRub: 43, deliveryPerLiterRub: 4, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
    { id: 218123, name: 'Краснодар', tariffs: { deliveryBaseLiterRub: 42, deliveryPerLiterRub: 4, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
  ]

  it('should return all warehouses for empty query', () => {
    expect(filterWarehouses(warehouses, '')).toEqual(warehouses)
    expect(filterWarehouses(warehouses, '   ')).toEqual(warehouses)
  })

  it('should filter by name (case-insensitive)', () => {
    const result = filterWarehouses(warehouses, 'казань')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Казань')
  })

  it('should filter by name (case-insensitive - uppercase)', () => {
    const result = filterWarehouses(warehouses, 'КОЛЕДИНО')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Коледино')
  })

  it('should filter by partial name match', () => {
    const result = filterWarehouses(warehouses, 'дол')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Подольск')
  })

  it('should filter by warehouse ID', () => {
    const result = filterWarehouses(warehouses, '507')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(507)
  })

  it('should filter by partial ID', () => {
    const result = filterWarehouses(warehouses, '117')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(117501)
  })

  it('should return empty array when no matches', () => {
    expect(filterWarehouses(warehouses, 'nonexistent')).toEqual([])
  })

  it('should return multiple matches', () => {
    // Filter for warehouses containing "од" (matches Подольск, Краснодар)
    const result = filterWarehouses(warehouses, 'од')
    expect(result).toHaveLength(2)
    expect(result.some((w) => w.name === 'Подольск')).toBe(true)
    expect(result.some((w) => w.name === 'Краснодар')).toBe(true)
  })
})

describe('isPopularWarehouse', () => {
  it('should return true for popular warehouse IDs', () => {
    expect(isPopularWarehouse(507)).toBe(true) // Коледино
    expect(isPopularWarehouse(117501)).toBe(true) // Подольск
    expect(isPopularWarehouse(117986)).toBe(true) // Электросталь
    expect(isPopularWarehouse(208699)).toBe(true) // Казань
    expect(isPopularWarehouse(218123)).toBe(true) // Краснодар
  })

  it('should return false for non-popular warehouse IDs', () => {
    expect(isPopularWarehouse(1)).toBe(false)
    expect(isPopularWarehouse(999999)).toBe(false)
    expect(isPopularWarehouse(0)).toBe(false)
  })
})

describe('separateWarehouses', () => {
  const warehouses: Warehouse[] = [
    { id: 507, name: 'Коледино', tariffs: { deliveryBaseLiterRub: 48, deliveryPerLiterRub: 5, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
    { id: 100001, name: 'Алматы', tariffs: { deliveryBaseLiterRub: 40, deliveryPerLiterRub: 3, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
    { id: 117501, name: 'Подольск', tariffs: { deliveryBaseLiterRub: 45, deliveryPerLiterRub: 4, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
    { id: 100002, name: 'Астана', tariffs: { deliveryBaseLiterRub: 38, deliveryPerLiterRub: 3, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
    { id: 208699, name: 'Казань', tariffs: { deliveryBaseLiterRub: 43, deliveryPerLiterRub: 4, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
  ]

  it('should separate popular and other warehouses', () => {
    const { popular, other } = separateWarehouses(warehouses)

    expect(popular).toHaveLength(3) // Коледино, Подольск, Казань
    expect(other).toHaveLength(2) // Алматы, Астана
  })

  it('should include correct warehouses in popular', () => {
    const { popular } = separateWarehouses(warehouses)

    const popularIds = popular.map((w) => w.id)
    expect(popularIds).toContain(507)
    expect(popularIds).toContain(117501)
    expect(popularIds).toContain(208699)
  })

  it('should include correct warehouses in other', () => {
    const { other } = separateWarehouses(warehouses)

    const otherIds = other.map((w) => w.id)
    expect(otherIds).toContain(100001)
    expect(otherIds).toContain(100002)
  })

  it('should handle empty input', () => {
    const { popular, other } = separateWarehouses([])
    expect(popular).toEqual([])
    expect(other).toEqual([])
  })

  it('should handle all popular warehouses', () => {
    const allPopular: Warehouse[] = [
      { id: 507, name: 'Коледино', tariffs: { deliveryBaseLiterRub: 48, deliveryPerLiterRub: 5, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
      { id: 117501, name: 'Подольск', tariffs: { deliveryBaseLiterRub: 45, deliveryPerLiterRub: 4, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
    ]

    const { popular, other } = separateWarehouses(allPopular)
    expect(popular).toHaveLength(2)
    expect(other).toHaveLength(0)
  })

  it('should handle no popular warehouses', () => {
    const nonPopular: Warehouse[] = [
      { id: 100001, name: 'Алматы', tariffs: { deliveryBaseLiterRub: 40, deliveryPerLiterRub: 3, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
      { id: 100002, name: 'Астана', tariffs: { deliveryBaseLiterRub: 38, deliveryPerLiterRub: 3, storageBaseLiterRub: 1, storagePerLiterRub: 1 } },
    ]

    const { popular, other } = separateWarehouses(nonPopular)
    expect(popular).toHaveLength(0)
    expect(other).toHaveLength(2)
  })
})
