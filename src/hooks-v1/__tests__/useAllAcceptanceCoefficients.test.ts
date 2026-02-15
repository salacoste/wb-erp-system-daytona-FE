/**
 * Unit tests for useAllAcceptanceCoefficients hook
 * Story 44.26a-FE: Fuzzy warehouse name matching
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Tests the fuzzy matching strategy for warehouse names:
 * - Exact match (case-insensitive)
 * - StartsWith match (e.g., "Владимир" → "Владимир Воршинское")
 * - Contains match (fallback)
 */

import { describe, it, expect } from 'vitest'
import {
  findCoefficientsByName,
  type GroupedCoefficients,
  type WarehouseCoefficientsData,
} from '../useAllAcceptanceCoefficients'

// ==========================================================================
// Test Fixtures
// ==========================================================================

function createWarehouseData(name: string, id: number): WarehouseCoefficientsData {
  return {
    warehouseId: id,
    warehouseName: name,
    coefficients: [],
  }
}

function createGroupedCoefficients(
  warehouses: Array<{ name: string; id: number }>
): GroupedCoefficients {
  const byName = new Map<string, WarehouseCoefficientsData>()
  const byId = new Map<number, WarehouseCoefficientsData>()

  for (const { name, id } of warehouses) {
    const data = createWarehouseData(name, id)
    byName.set(name, data)
    byId.set(id, data)
  }

  return { byName, byId }
}

// Sample OrdersFBW warehouse names (from /all endpoint)
const ordersFbwWarehouses = [
  { name: 'Владимир Воршинское', id: 301981 },
  { name: 'Коледино', id: 507 },
  { name: 'СЦ Подольск', id: 206348 },
  { name: 'Казань', id: 117501 },
  { name: 'Краснодар', id: 130744 },
  { name: 'Электросталь', id: 120762 },
  { name: 'Белые Столбы', id: 206236 },
]

// ==========================================================================
// findCoefficientsByName Tests
// ==========================================================================

describe('findCoefficientsByName', () => {
  describe('edge cases', () => {
    it('returns null when grouped is undefined', () => {
      const result = findCoefficientsByName(undefined, 'Коледино')
      expect(result).toBeNull()
    })

    it('returns null when warehouseName is undefined', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, undefined)
      expect(result).toBeNull()
    })

    it('returns null when warehouseName is empty string', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, '')
      expect(result).toBeNull()
    })
  })

  describe('exact match (case-insensitive)', () => {
    it('finds warehouse with exact name match', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'Коледино')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('Коледино')
      expect(result?.warehouseId).toBe(507)
    })

    it('finds warehouse with exact name match (different case)', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'коледино')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('Коледино')
    })

    it('finds warehouse with full name', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'Владимир Воршинское')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('Владимир Воршинское')
      expect(result?.warehouseId).toBe(301981)
    })
  })

  describe('startsWith match (fuzzy)', () => {
    it('matches "Владимир" to "Владимир Воршинское"', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'Владимир')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('Владимир Воршинское')
      expect(result?.warehouseId).toBe(301981)
    })

    it('matches "СЦ" to "СЦ Подольск"', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'СЦ')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('СЦ Подольск')
    })

    it('matches "Белые" to "Белые Столбы"', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'Белые')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('Белые Столбы')
    })

    it('matches with leading/trailing spaces trimmed', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, '  Владимир  ')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('Владимир Воршинское')
    })
  })

  describe('contains match (fallback)', () => {
    it('matches "Подольск" to "СЦ Подольск"', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'Подольск')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('СЦ Подольск')
    })

    it('matches "Столбы" to "Белые Столбы"', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'Столбы')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('Белые Столбы')
    })

    it('matches "Воршинское" to "Владимир Воршинское"', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'Воршинское')
      expect(result).not.toBeNull()
      expect(result?.warehouseName).toBe('Владимир Воршинское')
    })
  })

  describe('no match', () => {
    it('returns null when warehouse not found', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'Несуществующий склад')
      expect(result).toBeNull()
    })

    it('returns null for partial match that does not exist', () => {
      const grouped = createGroupedCoefficients(ordersFbwWarehouses)
      const result = findCoefficientsByName(grouped, 'Москва')
      expect(result).toBeNull()
    })
  })

  describe('priority order', () => {
    it('prefers exact match over startsWith match', () => {
      // Create a scenario where both could match
      const warehouses = [
        { name: 'Коледино', id: 507 },
        { name: 'Коледино Новое', id: 508 },
      ]
      const grouped = createGroupedCoefficients(warehouses)

      const result = findCoefficientsByName(grouped, 'Коледино')
      expect(result).not.toBeNull()
      expect(result?.warehouseId).toBe(507) // Exact match wins
    })

    it('prefers startsWith match over contains match', () => {
      // Create a scenario where startsWith should win
      const warehouses = [
        { name: 'СЦ Владимир', id: 100 },
        { name: 'Владимир Воршинское', id: 301981 },
      ]
      const grouped = createGroupedCoefficients(warehouses)

      const result = findCoefficientsByName(grouped, 'Владимир')
      expect(result).not.toBeNull()
      expect(result?.warehouseId).toBe(301981) // StartsWith match
    })
  })
})
