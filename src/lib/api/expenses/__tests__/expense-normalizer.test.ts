/**
 * Tests for expense-normalizer.ts
 * Covers: null handling, Decimal conversion, category mapping, summary normalization
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeExpenseItem,
  normalizeExpensesResponse,
  normalizeExpenseSummaryResponse,
} from '../expense-normalizer'

describe('normalizeExpenseItem', () => {
  it('normalizes a complete backend response', () => {
    const raw = {
      id: 'exp-1',
      cabinetId: 'cab-1',
      category: 'rent',
      amount: '15000.50',
      month: '2026-06',
      description: 'Office rent',
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z',
    }

    const result = normalizeExpenseItem(raw)

    expect(result.id).toBe('exp-1')
    expect(result.cabinetId).toBe('cab-1')
    expect(result.category).toBe('rent')
    expect(result.amount).toBe(15000.5)
    expect(result.month).toBe('2026-06')
    expect(result.description).toBe('Office rent')
    expect(result.createdAt).toBe('2026-06-01T10:00:00Z')
    expect(result.updatedAt).toBe('2026-06-01T10:00:00Z')
  })

  it('handles numeric amount (not string Decimal)', () => {
    const raw = {
      id: 'exp-2',
      cabinetId: 'cab-1',
      category: 'salary',
      amount: 50000,
      month: '2026-06',
      description: null,
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z',
    }

    const result = normalizeExpenseItem(raw)
    expect(result.amount).toBe(50000)
  })

  it('handles null amount as NaN', () => {
    const raw = {
      id: 'exp-3',
      cabinetId: 'cab-1',
      category: 'packaging',
      amount: null,
      month: '2026-06',
      description: null,
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z',
    }

    const result = normalizeExpenseItem(raw)
    expect(result.amount).toBeNaN()
  })

  it('maps unknown category to "other"', () => {
    const raw = {
      id: 'exp-4',
      cabinetId: 'cab-1',
      category: 'unknown_category',
      amount: 100,
      month: '2026-06',
      description: 'Something',
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z',
    }

    const result = normalizeExpenseItem(raw)
    expect(result.category).toBe('other')
  })

  it('handles missing fields gracefully', () => {
    const result = normalizeExpenseItem({})

    expect(result.id).toBe('')
    expect(result.cabinetId).toBe('')
    expect(result.category).toBe('other')
    expect(result.amount).toBeNaN()
    expect(result.month).toBe('')
    expect(result.description).toBeNull()
    expect(result.createdAt).toBe('')
    expect(result.updatedAt).toBe('')
  })

  it('handles non-string description as null', () => {
    const raw = {
      id: 'exp-5',
      cabinetId: 'cab-1',
      category: 'transport',
      amount: 3000,
      month: '2026-06',
      description: 12345,
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z',
    }

    const result = normalizeExpenseItem(raw)
    expect(result.description).toBeNull()
  })
})

describe('normalizeExpensesResponse', () => {
  it('normalizes an array of expense items', () => {
    const raw = [
      {
        id: 'exp-1',
        cabinetId: 'cab-1',
        category: 'rent',
        amount: '15000',
        month: '2026-06',
        description: null,
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
      },
      {
        id: 'exp-2',
        cabinetId: 'cab-1',
        category: 'salary',
        amount: 50000,
        month: '2026-06',
        description: 'June payroll',
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
      },
    ]

    const result = normalizeExpensesResponse(raw)

    expect(result).toHaveLength(2)
    expect(result[0].amount).toBe(15000)
    expect(result[1].amount).toBe(50000)
    expect(result[1].description).toBe('June payroll')
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeExpensesResponse(null)).toEqual([])
    expect(normalizeExpensesResponse(undefined)).toEqual([])
    expect(normalizeExpensesResponse({})).toEqual([])
    expect(normalizeExpensesResponse('not an array')).toEqual([])
  })

  it('returns empty array for empty array input', () => {
    expect(normalizeExpensesResponse([])).toEqual([])
  })
})

describe('normalizeExpenseSummaryResponse', () => {
  it('normalizes a complete summary response', () => {
    const raw = {
      total: '85000',
      byCategory: {
        rent: '15000',
        salary: 50000,
        packaging: '5000',
        transport: 10000,
        other: '5000',
      },
      byMonth: [
        { month: '2026-06', total: '85000' },
        { month: '2026-05', total: 80000 },
      ],
    }

    const result = normalizeExpenseSummaryResponse(raw)

    expect(result.total).toBe(85000)
    expect(result.byCategory.rent).toBe(15000)
    expect(result.byCategory.salary).toBe(50000)
    expect(result.byCategory.packaging).toBe(5000)
    expect(result.byCategory.transport).toBe(10000)
    expect(result.byCategory.other).toBe(5000)
    expect(result.byMonth).toHaveLength(2)
    expect(result.byMonth[0]).toEqual({ month: '2026-06', total: 85000 })
    expect(result.byMonth[1]).toEqual({ month: '2026-05', total: 80000 })
  })

  it('provides zero defaults for missing categories', () => {
    const raw = {
      total: 1000,
      byCategory: { rent: 1000 },
      byMonth: [],
    }

    const result = normalizeExpenseSummaryResponse(raw)

    expect(result.byCategory.rent).toBe(1000)
    expect(result.byCategory.salary).toBe(0)
    expect(result.byCategory.packaging).toBe(0)
    expect(result.byCategory.transport).toBe(0)
    expect(result.byCategory.other).toBe(0)
  })

  it('handles missing byCategory gracefully', () => {
    const raw = { total: 5000, byMonth: [] }

    const result = normalizeExpenseSummaryResponse(raw)

    expect(result.total).toBe(5000)
    expect(result.byCategory.rent).toBe(0)
    expect(result.byCategory.other).toBe(0)
  })

  it('handles completely empty input', () => {
    const result = normalizeExpenseSummaryResponse({})

    expect(result.total).toBe(0)
    expect(result.byMonth).toEqual([])
    expect(result.byCategory.rent).toBe(0)
  })

  it('handles null/undefined input', () => {
    const result = normalizeExpenseSummaryResponse(null)

    expect(result.total).toBe(0)
    expect(result.byMonth).toEqual([])
  })

  it('ignores unknown category keys in byCategory', () => {
    const raw = {
      total: 1000,
      byCategory: { rent: 1000, unknown: 9999 },
      byMonth: [],
    }

    const result = normalizeExpenseSummaryResponse(raw)

    expect(result.byCategory.rent).toBe(1000)
    expect('unknown' in result.byCategory).toBe(false)
  })

  it('handles null values in byMonth items', () => {
    const raw = {
      total: 1000,
      byCategory: {},
      byMonth: [null, undefined, { month: '2026-06', total: '500' }],
    }

    const result = normalizeExpenseSummaryResponse(raw)

    expect(result.byMonth).toHaveLength(3)
    expect(result.byMonth[0]).toEqual({ month: '', total: 0 })
    expect(result.byMonth[2]).toEqual({ month: '2026-06', total: 500 })
  })
})
