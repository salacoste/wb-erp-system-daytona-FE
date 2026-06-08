/**
 * Tests for useSingleCogsAssignment-utils.ts
 * Pure-function coverage: validateCogsAssignment, formatCogs, getMissingDataReasonMessage
 */

import { describe, it, expect } from 'vitest'
import type { MissingDataReason } from '@/types/api'
import {
  validateCogsAssignment,
  formatCogs,
  getMissingDataReasonMessage,
} from '../useSingleCogsAssignment-utils'

// ---------------------------------------------------------------------------
// validateCogsAssignment
// ---------------------------------------------------------------------------

describe('validateCogsAssignment', () => {
  it('returns error when unit_cost_rub is undefined', () => {
    const result = validateCogsAssignment({
      unit_cost_rub: undefined as unknown as number,
      valid_from: '2026-01-01',
    })
    expect(result.some(e => e.includes('обязательна'))).toBe(true)
  })

  it('returns error when unit_cost_rub is null', () => {
    const result = validateCogsAssignment({
      unit_cost_rub: null as unknown as number,
      valid_from: '2026-01-01',
    })
    expect(result.some(e => e.includes('обязательна'))).toBe(true)
  })

  it('returns error for negative unit_cost_rub', () => {
    const result = validateCogsAssignment({ unit_cost_rub: -10, valid_from: '2026-01-01' })
    expect(result.some(e => e.includes('отрицательной'))).toBe(true)
  })

  it('returns error for NaN unit_cost_rub', () => {
    const result = validateCogsAssignment({ unit_cost_rub: NaN, valid_from: '2026-01-01' })
    expect(result.some(e => e.includes('должна быть числом'))).toBe(true)
  })

  it('returns error for missing valid_from', () => {
    const result = validateCogsAssignment({ unit_cost_rub: 100, valid_from: '' })
    expect(result.some(e => e.includes('Дата начала'))).toBe(true)
  })

  it('returns error for future valid_from', () => {
    const result = validateCogsAssignment({ unit_cost_rub: 100, valid_from: '2099-06-01' })
    expect(result.some(e => e.includes('будущем'))).toBe(true)
  })

  it('returns error for valid_from more than a year ago', () => {
    const result = validateCogsAssignment({ unit_cost_rub: 100, valid_from: '2020-01-01' })
    expect(result.some(e => e.includes('года назад'))).toBe(true)
  })

  it('returns error for invalid date format', () => {
    const result = validateCogsAssignment({ unit_cost_rub: 100, valid_from: 'not-a-date' })
    expect(result.some(e => e.includes('формат даты'))).toBe(true)
  })

  it('returns error for invalid currency', () => {
    const result = validateCogsAssignment({
      unit_cost_rub: 100,
      valid_from: '2026-01-01',
      currency: 'GBP',
    })
    expect(result.some(e => e.includes('Валюта'))).toBe(true)
  })

  it('returns no errors for valid assignment', () => {
    const result = validateCogsAssignment({ unit_cost_rub: 100, valid_from: '2026-01-01' })
    expect(result).toHaveLength(0)
  })

  it('accepts valid currencies: RUB, USD, EUR, CNY', () => {
    for (const currency of ['RUB', 'USD', 'EUR', 'CNY']) {
      const result = validateCogsAssignment({
        unit_cost_rub: 100,
        valid_from: '2026-01-01',
        currency,
      })
      expect(result).toHaveLength(0)
    }
  })

  it('returns multiple errors simultaneously', () => {
    const result = validateCogsAssignment({
      unit_cost_rub: -10,
      valid_from: '',
      currency: 'GBP',
    })
    expect(result.length).toBeGreaterThanOrEqual(3)
  })
})

// ---------------------------------------------------------------------------
// formatCogs
// ---------------------------------------------------------------------------

describe('formatCogs', () => {
  it('returns dash for null', () => {
    expect(formatCogs(null)).toBe('—')
  })

  it('returns dash for undefined', () => {
    expect(formatCogs(undefined)).toBe('—')
  })

  it('returns dash for NaN string', () => {
    expect(formatCogs('not-a-number')).toBe('—')
  })

  it('formats number in Russian locale with currency', () => {
    const result = formatCogs(1250.5)
    expect(result).toMatch(/1\s250,50/)
    expect(result).toContain('₽')
  })

  it('formats string number', () => {
    const result = formatCogs('3000')
    expect(result).toMatch(/3\s000/)
    expect(result).toContain('₽')
  })

  it('formats zero', () => {
    const result = formatCogs(0)
    expect(result).toContain('0,00')
  })
})

// ---------------------------------------------------------------------------
// getMissingDataReasonMessage
// ---------------------------------------------------------------------------

describe('getMissingDataReasonMessage', () => {
  it('returns correct message for COGS_NOT_ASSIGNED', () => {
    expect(getMissingDataReasonMessage('COGS_NOT_ASSIGNED')).toContain('себестоимость')
  })

  it('returns correct message for NO_SALES_IN_PERIOD', () => {
    expect(getMissingDataReasonMessage('NO_SALES_IN_PERIOD')).toContain('продаж')
  })

  it('returns correct message for NO_SALES_DATA', () => {
    expect(getMissingDataReasonMessage('NO_SALES_DATA')).toContain('Нет продаж')
  })

  it('returns correct message for ANALYTICS_UNAVAILABLE', () => {
    expect(getMissingDataReasonMessage('ANALYTICS_UNAVAILABLE')).toContain('недоступны')
  })

  it('returns null for null reason', () => {
    expect(getMissingDataReasonMessage(null)).toBeNull()
  })

  it('returns fallback for unknown reason string', () => {
    expect(getMissingDataReasonMessage('UNKNOWN_FUTURE' as MissingDataReason)).toContain(
      'недоступны'
    )
  })
})
