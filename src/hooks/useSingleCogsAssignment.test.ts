/**
 * Unit tests for useSingleCogsAssignment hook
 * Story 4.3: COGS Input Validation & Error Handling
 *
 * Tests validation functions, formatters, and edge cases:
 * - validateCogsAssignment: COGS validation logic
 * - formatCogs: Currency formatting
 * - getMissingDataReasonMessage: User-friendly messages
 */

import { describe, it, expect } from 'vitest'
import {
  validateCogsAssignment,
  formatCogs,
  getMissingDataReasonMessage,
} from './useSingleCogsAssignment'
import type { CogsAssignmentRequest } from '@/types/cogs'

describe('validateCogsAssignment', () => {
  describe('unit_cost_rub validation', () => {
    it('should pass validation for valid positive number', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 1250.5,
        valid_from: '2025-11-23',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should pass validation for zero value', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 0,
        valid_from: '2025-11-23',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation when unit_cost_rub is missing', () => {
      const cogs = {
        valid_from: '2025-11-23',
        source: 'manual',
      } as CogsAssignmentRequest

      const errors = validateCogsAssignment(cogs)
      expect(errors).toContain('Себестоимость обязательна для заполнения')
    })

    it('should fail validation for negative number', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: -100,
        valid_from: '2025-11-23',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toContain('Себестоимость не может быть отрицательной')
    })

    it('should fail validation for non-finite number (Infinity)', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: Infinity,
        valid_from: '2025-11-23',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toContain('Себестоимость должна быть числом')
    })

    it('should fail validation for non-finite number (NaN)', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: NaN,
        valid_from: '2025-11-23',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toContain('Себестоимость должна быть числом')
    })

    it('should support decimal values', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 123.456789,
        valid_from: '2025-11-23',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should support very large numbers', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 999999999.99,
        valid_from: '2025-11-23',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should support very small decimal numbers', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 0.01,
        valid_from: '2025-11-23',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })
  })

  describe('valid_from validation', () => {
    it('should pass validation for today\'s date', () => {
      const today = new Date().toISOString().split('T')[0]
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: today,
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should pass validation for date 6 months ago', () => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const dateStr = sixMonthsAgo.toISOString().split('T')[0]

      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: dateStr,
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation when valid_from is missing', () => {
      const cogs = {
        unit_cost_rub: 100,
        source: 'manual',
      } as CogsAssignmentRequest

      const errors = validateCogsAssignment(cogs)
      expect(errors).toContain('Дата начала действия обязательна для заполнения')
    })

    it('should fail validation for future date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]

      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: dateStr,
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toContain('Дата начала действия не может быть в будущем')
    })

    it('should fail validation for date more than 1 year ago', () => {
      const moreThanYearAgo = new Date()
      moreThanYearAgo.setFullYear(moreThanYearAgo.getFullYear() - 1)
      moreThanYearAgo.setDate(moreThanYearAgo.getDate() - 1)
      const dateStr = moreThanYearAgo.toISOString().split('T')[0]

      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: dateStr,
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toContain('Дата начала действия не может быть более года назад')
    })

    it('should fail validation for invalid date format', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: 'invalid-date',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toContain('Неверный формат даты')
    })
  })

  describe('currency validation', () => {
    it('should pass validation for valid currency RUB', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: '2025-11-23',
        currency: 'RUB',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should pass validation for valid currency USD', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: '2025-11-23',
        currency: 'USD',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should pass validation for valid currency EUR', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: '2025-11-23',
        currency: 'EUR',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should pass validation for valid currency CNY', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: '2025-11-23',
        currency: 'CNY',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should pass validation when currency is not provided', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: '2025-11-23',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation for invalid currency', () => {
      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: 100,
        valid_from: '2025-11-23',
        currency: 'GBP',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors).toContain('Валюта должна быть одной из: RUB, USD, EUR, CNY')
    })
  })

  describe('multiple validation errors', () => {
    it('should return multiple errors when multiple fields are invalid', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const cogs: CogsAssignmentRequest = {
        unit_cost_rub: -50,
        valid_from: tomorrow.toISOString().split('T')[0],
        currency: 'INVALID',
        source: 'manual',
      }

      const errors = validateCogsAssignment(cogs)
      expect(errors.length).toBeGreaterThan(1)
      expect(errors).toContain('Себестоимость не может быть отрицательной')
      expect(errors).toContain('Дата начала действия не может быть в будущем')
      expect(errors).toContain('Валюта должна быть одной из: RUB, USD, EUR, CNY')
    })
  })
})

describe('formatCogs', () => {
  it('should format positive number as Russian currency', () => {
    const result = formatCogs(1250.5)
    expect(result).toMatch(/1\s?250,50/)
    expect(result).toContain('₽')
  })

  it('should format zero as currency', () => {
    const result = formatCogs(0)
    expect(result).toMatch(/0,00/)
    expect(result).toContain('₽')
  })

  it('should format large numbers with thousands separator', () => {
    const result = formatCogs(1234567.89)
    expect(result).toMatch(/1\s?234\s?567,89/)
    expect(result).toContain('₽')
  })

  it('should format small decimal numbers', () => {
    const result = formatCogs(0.01)
    expect(result).toMatch(/0,01/)
    expect(result).toContain('₽')
  })

  it('should format string numbers', () => {
    const result = formatCogs('1250.50')
    expect(result).toMatch(/1\s?250,50/)
    expect(result).toContain('₽')
  })

  it('should return dash for null', () => {
    const result = formatCogs(null)
    expect(result).toBe('—')
  })

  it('should return dash for undefined', () => {
    const result = formatCogs(undefined)
    expect(result).toBe('—')
  })

  it('should return dash for NaN string', () => {
    const result = formatCogs('not-a-number')
    expect(result).toBe('—')
  })

  it('should handle negative numbers', () => {
    const result = formatCogs(-100)
    expect(result).toMatch(/-100,00/)
    expect(result).toContain('₽')
  })
})

describe('getMissingDataReasonMessage', () => {
  it('should return correct message for COGS_NOT_ASSIGNED', () => {
    const result = getMissingDataReasonMessage('COGS_NOT_ASSIGNED')
    expect(result).toBe('Назначьте себестоимость для расчёта маржи')
  })

  it('should return correct message for NO_SALES_IN_PERIOD', () => {
    const result = getMissingDataReasonMessage('NO_SALES_IN_PERIOD')
    expect(result).toBe('Нет продаж на прошлой неделе')
  })

  it('should return correct message for NO_SALES_DATA', () => {
    const result = getMissingDataReasonMessage('NO_SALES_DATA')
    expect(result).toBe('Нет продаж')
  })

  it('should return null for null reason', () => {
    const result = getMissingDataReasonMessage(null)
    expect(result).toBeNull()
  })

  it('should return default message for unknown reason', () => {
    const result = getMissingDataReasonMessage('unknown' as any)
    expect(result).toBe('Данные недоступны')
  })
})
