/**
 * Unit tests for useBulkCogsAssignment hook
 * Story 4.3: COGS Input Validation & Error Handling
 *
 * Tests bulk validation functions and edge cases:
 * - validateBulkCogsAssignment: Bulk COGS validation logic
 * - createBulkCogsItems: Helper function for creating bulk items
 */

import { describe, it, expect } from 'vitest'
import {
  validateBulkCogsAssignment,
  createBulkCogsItems,
} from './useBulkCogsAssignment'
import type { BulkCogsItem } from '@/types/cogs'

describe('validateBulkCogsAssignment', () => {
  describe('basic validation', () => {
    it('should pass validation for valid bulk items', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: 1250.5,
          valid_from: '2025-11-23',
          source: 'manual',
        },
        {
          nm_id: '87654321',
          unit_cost_rub: 999.99,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation when items array is empty', () => {
      const errors = validateBulkCogsAssignment([])
      expect(errors).toContain('Необходимо выбрать хотя бы один товар')
    })

    it('should fail validation when items exceed 1000', () => {
      const items: BulkCogsItem[] = Array.from({ length: 1001 }, (_, i) => ({
        nm_id: `${i}`,
        unit_cost_rub: 100,
        valid_from: '2025-11-23',
        source: 'manual',
      }))

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Максимум 1000 товаров за один раз. Выбрано: 1001')
    })

    it('should pass validation for exactly 1000 items', () => {
      const items: BulkCogsItem[] = Array.from({ length: 1000 }, (_, i) => ({
        nm_id: `${i}`,
        unit_cost_rub: 100,
        valid_from: '2025-11-23',
        source: 'manual',
      }))

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toHaveLength(0)
    })
  })

  describe('nm_id validation', () => {
    it('should fail validation when nm_id is missing', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '',
          unit_cost_rub: 100,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1: Артикул обязателен')
    })

    it('should fail validation when nm_id is only whitespace', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '   ',
          unit_cost_rub: 100,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1: Артикул обязателен')
    })

    it('should include nm_id in error messages for easier identification', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: -100,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1 (12345678): Себестоимость не может быть отрицательной')
    })
  })

  describe('unit_cost_rub validation', () => {
    it('should pass validation for zero value', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: 0,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation when unit_cost_rub is missing', () => {
      const items = [
        {
          nm_id: '12345678',
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ] as BulkCogsItem[]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1 (12345678): Себестоимость обязательна')
    })

    it('should fail validation for negative number', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: -50,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1 (12345678): Себестоимость не может быть отрицательной')
    })

    it('should fail validation for Infinity', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: Infinity,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1 (12345678): Себестоимость должна быть числом')
    })

    it('should fail validation for NaN', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: NaN,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1 (12345678): Себестоимость должна быть числом')
    })

    it('should support decimal values', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: 123.456789,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toHaveLength(0)
    })
  })

  describe('valid_from validation', () => {
    it('should pass validation for today\'s date', () => {
      const today = new Date().toISOString().split('T')[0]
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: 100,
          valid_from: today,
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation when valid_from is missing', () => {
      const items = [
        {
          nm_id: '12345678',
          unit_cost_rub: 100,
          source: 'manual',
        },
      ] as BulkCogsItem[]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1 (12345678): Дата начала действия обязательна')
    })

    it('should fail validation for future date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]

      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: 100,
          valid_from: dateStr,
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1 (12345678): Дата не может быть в будущем')
    })

    it('should fail validation for date more than 1 year ago', () => {
      const moreThanYearAgo = new Date()
      moreThanYearAgo.setFullYear(moreThanYearAgo.getFullYear() - 1)
      moreThanYearAgo.setDate(moreThanYearAgo.getDate() - 1)
      const dateStr = moreThanYearAgo.toISOString().split('T')[0]

      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: 100,
          valid_from: dateStr,
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1 (12345678): Дата не может быть более года назад')
    })

    it('should fail validation for invalid date format', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: 100,
          valid_from: 'invalid-date',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain('Товар 1 (12345678): Неверный формат даты')
    })
  })

  describe('currency validation', () => {
    it('should pass validation for valid currencies', () => {
      const validCurrencies = ['RUB', 'USD', 'EUR', 'CNY']

      validCurrencies.forEach((currency) => {
        const items: BulkCogsItem[] = [
          {
            nm_id: '12345678',
            unit_cost_rub: 100,
            valid_from: '2025-11-23',
            currency,
            source: 'manual',
          },
        ]

        const errors = validateBulkCogsAssignment(items)
        expect(errors).toHaveLength(0)
      })
    })

    it('should pass validation when currency is not provided', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: 100,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation for invalid currency', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: 100,
          valid_from: '2025-11-23',
          currency: 'GBP',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors).toContain(
        'Товар 1 (12345678): Валюта должна быть одной из: RUB, USD, EUR, CNY'
      )
    })
  })

  describe('multiple items validation', () => {
    it('should validate all items and collect all errors', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: -100,
          valid_from: '2025-11-23',
          source: 'manual',
        },
        {
          nm_id: '87654321',
          unit_cost_rub: 100,
          valid_from: tomorrow.toISOString().split('T')[0],
          source: 'manual',
        },
        {
          nm_id: '99999999',
          unit_cost_rub: Infinity,
          valid_from: 'invalid-date',
          currency: 'INVALID',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain('Товар 1 (12345678): Себестоимость не может быть отрицательной')
      expect(errors).toContain('Товар 2 (87654321): Дата не может быть в будущем')
      expect(errors).toContain('Товар 3 (99999999): Себестоимость должна быть числом')
      expect(errors).toContain('Товар 3 (99999999): Неверный формат даты')
      expect(errors).toContain(
        'Товар 3 (99999999): Валюта должна быть одной из: RUB, USD, EUR, CNY'
      )
    })

    it('should deduplicate identical errors', () => {
      const items: BulkCogsItem[] = [
        {
          nm_id: '12345678',
          unit_cost_rub: -100,
          valid_from: '2025-11-23',
          source: 'manual',
        },
        {
          nm_id: '87654321',
          unit_cost_rub: -100,
          valid_from: '2025-11-23',
          source: 'manual',
        },
      ]

      const errors = validateBulkCogsAssignment(items)
      // Should have 2 unique errors (one for each item), not duplicated
      expect(errors).toHaveLength(2)
    })
  })
})

describe('createBulkCogsItems', () => {
  it('should create bulk items from array of nm_ids', () => {
    const nmIds = ['12345678', '87654321', '99999999']
    const unitCostRub = 1250.5
    const validFrom = '2025-11-23'

    const items = createBulkCogsItems(nmIds, unitCostRub, validFrom)

    expect(items).toHaveLength(3)
    expect(items[0]).toEqual({
      nm_id: '12345678',
      unit_cost_rub: 1250.5,
      valid_from: '2025-11-23',
      source: 'manual',
    })
    expect(items[1]).toEqual({
      nm_id: '87654321',
      unit_cost_rub: 1250.5,
      valid_from: '2025-11-23',
      source: 'manual',
    })
    expect(items[2]).toEqual({
      nm_id: '99999999',
      unit_cost_rub: 1250.5,
      valid_from: '2025-11-23',
      source: 'manual',
    })
  })

  it('should support optional currency parameter', () => {
    const nmIds = ['12345678']
    const unitCostRub = 100
    const validFrom = '2025-11-23'

    const items = createBulkCogsItems(nmIds, unitCostRub, validFrom, {
      currency: 'USD',
    })

    expect(items[0].currency).toBe('USD')
  })

  it('should support optional source parameter', () => {
    const nmIds = ['12345678']
    const unitCostRub = 100
    const validFrom = '2025-11-23'

    const items = createBulkCogsItems(nmIds, unitCostRub, validFrom, {
      source: 'import',
    })

    expect(items[0].source).toBe('import')
  })

  it('should support optional notes parameter', () => {
    const nmIds = ['12345678']
    const unitCostRub = 100
    const validFrom = '2025-11-23'

    const items = createBulkCogsItems(nmIds, unitCostRub, validFrom, {
      notes: 'Test notes',
    })

    expect(items[0].notes).toBe('Test notes')
  })

  it('should use default source "manual" when not provided', () => {
    const nmIds = ['12345678']
    const unitCostRub = 100
    const validFrom = '2025-11-23'

    const items = createBulkCogsItems(nmIds, unitCostRub, validFrom)

    expect(items[0].source).toBe('manual')
  })

  it('should handle empty array', () => {
    const items = createBulkCogsItems([], 100, '2025-11-23')

    expect(items).toHaveLength(0)
  })

  it('should handle single item', () => {
    const items = createBulkCogsItems(['12345678'], 100, '2025-11-23')

    expect(items).toHaveLength(1)
    expect(items[0].nm_id).toBe('12345678')
  })

  it('should handle large arrays efficiently', () => {
    const nmIds = Array.from({ length: 1000 }, (_, i) => `${i}`)
    const items = createBulkCogsItems(nmIds, 100, '2025-11-23')

    expect(items).toHaveLength(1000)
    expect(items[0].nm_id).toBe('0')
    expect(items[999].nm_id).toBe('999')
  })
})
