/**
 * Unit tests for useCogsDelete hook helpers
 * Story 5.3-fe: COGS Delete Confirmation Dialog
 *
 * Tests version chain analysis and formatting functions:
 * - analyzeVersionChain: Version chain analysis for delete confirmation
 * - formatDateForDelete: Date formatting
 * - formatCurrencyForDelete: Currency formatting
 */

import { describe, it, expect } from 'vitest'
import {
  analyzeVersionChain,
  formatDateForDelete,
  formatCurrencyForDelete,
} from './useCogsDelete'
import type { CogsHistoryItem } from '@/types/cogs'

const createMockItem = (
  overrides: Partial<CogsHistoryItem> = {}
): CogsHistoryItem => ({
  cogs_id: 'cogs-1',
  nm_id: '12345678',
  unit_cost_rub: 100,
  currency: 'RUB',
  valid_from: '2025-01-01',
  valid_to: null,
  source: 'manual',
  notes: null,
  created_by: 'user-1',
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-01T10:00:00Z',
  is_active: true,
  affected_weeks: ['2025-W01', '2025-W02'],
  ...overrides,
})

describe('formatDateForDelete', () => {
  it('should format ISO date string to Russian locale', () => {
    const result = formatDateForDelete('2025-01-15')
    expect(result).toBe('15.01.2025')
  })

  it('should return "текущий" for null', () => {
    const result = formatDateForDelete(null)
    expect(result).toBe('текущий')
  })

  it('should handle date with time component', () => {
    const result = formatDateForDelete('2025-01-15T10:30:00Z')
    expect(result).toMatch(/15\.01\.2025/)
  })

  it('should return original string for invalid date', () => {
    const result = formatDateForDelete('invalid-date')
    expect(result).toBe('invalid-date')
  })
})

describe('formatCurrencyForDelete', () => {
  it('should format positive number as Russian currency', () => {
    const result = formatCurrencyForDelete(1250.5)
    expect(result).toMatch(/1\s?250,50/)
    expect(result).toContain('₽')
  })

  it('should format zero as currency', () => {
    const result = formatCurrencyForDelete(0)
    expect(result).toMatch(/0,00/)
    expect(result).toContain('₽')
  })

  it('should format large numbers with thousands separator', () => {
    const result = formatCurrencyForDelete(1234567.89)
    expect(result).toMatch(/1\s?234\s?567,89/)
    expect(result).toContain('₽')
  })
})

describe('analyzeVersionChain', () => {
  describe('single version (isOnlyVersion)', () => {
    it('should identify single active version as only version', () => {
      const record = createMockItem({ cogs_id: 'cogs-1' })
      const history = [record]

      const result = analyzeVersionChain(record, history)

      expect(result.isOnlyVersion).toBe(true)
      expect(result.isCurrentVersion).toBe(true) // no valid_to
      expect(result.hasPreviousVersion).toBe(false)
    })

    it('should count only active versions for isOnlyVersion', () => {
      const active = createMockItem({ cogs_id: 'cogs-1', is_active: true })
      const deleted = createMockItem({ cogs_id: 'cogs-2', is_active: false })
      const history = [active, deleted]

      const result = analyzeVersionChain(active, history)

      expect(result.isOnlyVersion).toBe(true) // Only 1 active
    })
  })

  describe('current version detection', () => {
    it('should identify record with null valid_to as current version', () => {
      const record = createMockItem({ valid_to: null })
      const history = [record]

      const result = analyzeVersionChain(record, history)

      expect(result.isCurrentVersion).toBe(true)
    })

    it('should identify record with valid_to as not current version', () => {
      const record = createMockItem({ valid_to: '2025-02-01' })
      const history = [record]

      const result = analyzeVersionChain(record, history)

      expect(result.isCurrentVersion).toBe(false)
    })
  })

  describe('previous version detection', () => {
    it('should detect previous version when valid_to matches valid_from', () => {
      const older = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        valid_to: '2025-02-01',
        unit_cost_rub: 100,
        is_active: true,
      })
      const newer = createMockItem({
        cogs_id: 'cogs-2',
        valid_from: '2025-02-01',
        valid_to: null,
        unit_cost_rub: 150,
        is_active: true,
      })
      const history = [older, newer]

      const result = analyzeVersionChain(newer, history)

      expect(result.hasPreviousVersion).toBe(true)
      expect(result.previousVersionCost).toBe(100)
      expect(result.previousVersionDate).toBe('2025-01-01')
    })

    it('should not find previous version when dates do not match', () => {
      const older = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        valid_to: '2025-01-15', // Does not match newer's valid_from
        is_active: true,
      })
      const newer = createMockItem({
        cogs_id: 'cogs-2',
        valid_from: '2025-02-01',
        valid_to: null,
        is_active: true,
      })
      const history = [older, newer]

      const result = analyzeVersionChain(newer, history)

      expect(result.hasPreviousVersion).toBe(false)
    })

    it('should not find previous version if it is deleted', () => {
      const older = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        valid_to: '2025-02-01',
        is_active: false, // Deleted
      })
      const newer = createMockItem({
        cogs_id: 'cogs-2',
        valid_from: '2025-02-01',
        valid_to: null,
        is_active: true,
      })
      const history = [older, newer]

      const result = analyzeVersionChain(newer, history)

      expect(result.hasPreviousVersion).toBe(false)
    })
  })

  describe('multiple versions', () => {
    it('should correctly analyze middle version in chain', () => {
      const oldest = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        valid_to: '2025-02-01',
        unit_cost_rub: 100,
        is_active: true,
      })
      const middle = createMockItem({
        cogs_id: 'cogs-2',
        valid_from: '2025-02-01',
        valid_to: '2025-03-01',
        unit_cost_rub: 150,
        is_active: true,
      })
      const newest = createMockItem({
        cogs_id: 'cogs-3',
        valid_from: '2025-03-01',
        valid_to: null,
        unit_cost_rub: 200,
        is_active: true,
      })
      const history = [oldest, middle, newest]

      const result = analyzeVersionChain(middle, history)

      expect(result.isCurrentVersion).toBe(false) // Has valid_to
      expect(result.isOnlyVersion).toBe(false) // 3 active versions
      expect(result.hasPreviousVersion).toBe(true) // oldest matches
      expect(result.previousVersionCost).toBe(100)
    })

    it('should handle isOnlyVersion=false when multiple active', () => {
      const older = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        valid_to: '2025-02-01',
        is_active: true,
      })
      const newer = createMockItem({
        cogs_id: 'cogs-2',
        valid_from: '2025-02-01',
        valid_to: null,
        is_active: true,
      })
      const history = [older, newer]

      const result = analyzeVersionChain(newer, history)

      expect(result.isOnlyVersion).toBe(false) // 2 active versions
    })
  })

  describe('edge cases', () => {
    it('should handle empty history', () => {
      const record = createMockItem()
      const history: CogsHistoryItem[] = []

      const result = analyzeVersionChain(record, history)

      // Empty history: activeVersions.length === 0, so isOnlyVersion = false (0 !== 1)
      expect(result.isOnlyVersion).toBe(false)
      expect(result.hasPreviousVersion).toBe(false)
    })

    it('should not match record with itself as previous version', () => {
      const record = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        valid_to: '2025-01-01', // Edge case: same date
      })
      const history = [record]

      const result = analyzeVersionChain(record, history)

      expect(result.hasPreviousVersion).toBe(false)
    })
  })
})
