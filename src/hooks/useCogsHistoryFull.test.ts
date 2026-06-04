/**
 * Unit tests for useCogsHistoryFull hook helpers
 * Story 5.1-fe: View COGS History
 *
 * Tests utility functions for COGS history display:
 * - formatDateRu: Russian date formatting
 * - formatCurrencyRu: Russian currency formatting
 * - getSourceLabel: Source type labels
 * - getSourceIcon: Source type icons
 * - analyzeVersionChain: Version chain analysis for delete dialog
 * - formatWeeksCount: Russian plural for weeks
 */

import { describe, it, expect } from 'vitest'
import {
  formatDateRu,
  formatCurrencyRu,
  getSourceLabel,
  getSourceIcon,
  analyzeVersionChain,
  formatWeeksCount,
} from './useCogsHistoryFull'
import type { CogsHistoryItem } from '@/types/cogs'

describe('formatDateRu', () => {
  it('should format ISO date string to Russian locale', () => {
    const result = formatDateRu('2025-01-15')
    expect(result).toBe('15.01.2025')
  })

  it('should format date with time component', () => {
    const result = formatDateRu('2025-01-15T10:30:00Z')
    expect(result).toMatch(/15\.01\.2025/)
  })

  it('should return dash for null', () => {
    const result = formatDateRu(null)
    expect(result).toBe('—')
  })

  it('should return dash for undefined', () => {
    const result = formatDateRu(undefined)
    expect(result).toBe('—')
  })

  it('should return dash for invalid date string', () => {
    const result = formatDateRu('invalid-date')
    expect(result).toBe('—')
  })

  it('should return dash for empty string', () => {
    const result = formatDateRu('')
    expect(result).toBe('—')
  })
})

describe('formatCurrencyRu', () => {
  it('should format positive number as Russian currency', () => {
    const result = formatCurrencyRu(1250.5)
    expect(result).toMatch(/1\s?250,50/)
    expect(result).toContain('₽')
  })

  it('should format zero as currency', () => {
    const result = formatCurrencyRu(0)
    expect(result).toMatch(/0,00/)
    expect(result).toContain('₽')
  })

  it('should format large numbers with thousands separator', () => {
    const result = formatCurrencyRu(1234567.89)
    expect(result).toMatch(/1\s?234\s?567,89/)
    expect(result).toContain('₽')
  })

  it('should format small decimal numbers', () => {
    const result = formatCurrencyRu(0.01)
    expect(result).toMatch(/0,01/)
    expect(result).toContain('₽')
  })

  it('should return dash for null', () => {
    const result = formatCurrencyRu(null)
    expect(result).toBe('—')
  })

  it('should return dash for undefined', () => {
    const result = formatCurrencyRu(undefined)
    expect(result).toBe('—')
  })

  it('should return dash for NaN / Infinity (normalizer sentinel), not "не число ₽"', () => {
    expect(formatCurrencyRu(NaN)).toBe('—')
    expect(formatCurrencyRu(Infinity)).toBe('—')
  })

  it('should handle negative numbers', () => {
    const result = formatCurrencyRu(-100)
    expect(result).toMatch(/-100,00/)
    expect(result).toContain('₽')
  })
})

describe('getSourceLabel', () => {
  it('should return "Ручной ввод" for manual source', () => {
    const result = getSourceLabel('manual')
    expect(result).toBe('Ручной ввод')
  })

  it('should return "Импорт" for import source', () => {
    const result = getSourceLabel('import')
    expect(result).toBe('Импорт')
  })

  it('should return "Система" for system source', () => {
    const result = getSourceLabel('system')
    expect(result).toBe('Система')
  })

  it('should return source as-is for unknown source', () => {
    const result = getSourceLabel('unknown')
    expect(result).toBe('unknown')
  })
})

describe('getSourceIcon', () => {
  it('should return pencil emoji for manual source', () => {
    const result = getSourceIcon('manual')
    expect(result).toBe('✏️')
  })

  it('should return inbox emoji for import source', () => {
    const result = getSourceIcon('import')
    expect(result).toBe('📥')
  })

  it('should return gear emoji for system source', () => {
    const result = getSourceIcon('system')
    expect(result).toBe('⚙️')
  })

  it('should return clipboard emoji for unknown source', () => {
    const result = getSourceIcon('unknown')
    expect(result).toBe('📋')
  })
})

describe('formatWeeksCount', () => {
  it('should use "неделя" for 1', () => {
    const result = formatWeeksCount(1)
    expect(result).toBe('1 неделя')
  })

  it('should use "недели" for 2', () => {
    const result = formatWeeksCount(2)
    expect(result).toBe('2 недели')
  })

  it('should use "недели" for 3', () => {
    const result = formatWeeksCount(3)
    expect(result).toBe('3 недели')
  })

  it('should use "недели" for 4', () => {
    const result = formatWeeksCount(4)
    expect(result).toBe('4 недели')
  })

  it('should use "недель" for 5', () => {
    const result = formatWeeksCount(5)
    expect(result).toBe('5 недель')
  })

  it('should use "недель" for 10', () => {
    const result = formatWeeksCount(10)
    expect(result).toBe('10 недель')
  })

  it('should use "недель" for 11', () => {
    const result = formatWeeksCount(11)
    expect(result).toBe('11 недель')
  })

  it('should use "недель" for 12', () => {
    const result = formatWeeksCount(12)
    expect(result).toBe('12 недель')
  })

  it('should use "неделя" for 21', () => {
    const result = formatWeeksCount(21)
    expect(result).toBe('21 неделя')
  })

  it('should use "недели" for 22', () => {
    const result = formatWeeksCount(22)
    expect(result).toBe('22 недели')
  })

  it('should use "недель" for 0', () => {
    const result = formatWeeksCount(0)
    expect(result).toBe('0 недель')
  })
})

describe('analyzeVersionChain', () => {
  const createMockItem = (overrides: Partial<CogsHistoryItem> = {}): CogsHistoryItem => ({
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

  describe('single version', () => {
    it('should identify single version as current and only', () => {
      const item = createMockItem({ cogs_id: 'cogs-1' })
      const allItems = [item]

      const result = analyzeVersionChain(item, allItems)

      expect(result.isCurrentVersion).toBe(true)
      expect(result.isOnlyVersion).toBe(true)
      expect(result.hasPreviousVersion).toBe(false)
      expect(result.previousVersionCost).toBeUndefined()
      expect(result.previousVersionDate).toBeUndefined()
    })
  })

  describe('multiple versions', () => {
    it('should identify current version correctly', () => {
      const older = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        unit_cost_rub: 100,
      })
      const newer = createMockItem({
        cogs_id: 'cogs-2',
        valid_from: '2025-02-01',
        unit_cost_rub: 150,
      })
      const allItems = [older, newer]

      const result = analyzeVersionChain(newer, allItems)

      expect(result.isCurrentVersion).toBe(true)
      expect(result.isOnlyVersion).toBe(false)
      expect(result.hasPreviousVersion).toBe(true)
      expect(result.previousVersionCost).toBe(100)
      expect(result.previousVersionDate).toBe('2025-01-01')
    })

    it('should identify non-current version correctly', () => {
      const older = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        unit_cost_rub: 100,
      })
      const newer = createMockItem({
        cogs_id: 'cogs-2',
        valid_from: '2025-02-01',
        unit_cost_rub: 150,
      })
      const allItems = [older, newer]

      const result = analyzeVersionChain(older, allItems)

      expect(result.isCurrentVersion).toBe(false)
      expect(result.isOnlyVersion).toBe(false)
      expect(result.hasPreviousVersion).toBe(false)
    })
  })

  describe('deleted versions', () => {
    it('should exclude deleted items from analysis', () => {
      const active = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        is_active: true,
      })
      const deleted = createMockItem({
        cogs_id: 'cogs-2',
        valid_from: '2025-02-01',
        is_active: false,
      })
      const allItems = [active, deleted]

      const result = analyzeVersionChain(active, allItems)

      expect(result.isCurrentVersion).toBe(true)
      expect(result.isOnlyVersion).toBe(true) // Only 1 active item
      expect(result.hasPreviousVersion).toBe(false)
    })
  })

  describe('three versions', () => {
    it('should correctly identify middle version', () => {
      const oldest = createMockItem({
        cogs_id: 'cogs-1',
        valid_from: '2025-01-01',
        unit_cost_rub: 100,
      })
      const middle = createMockItem({
        cogs_id: 'cogs-2',
        valid_from: '2025-02-01',
        unit_cost_rub: 150,
      })
      const newest = createMockItem({
        cogs_id: 'cogs-3',
        valid_from: '2025-03-01',
        unit_cost_rub: 200,
      })
      const allItems = [oldest, middle, newest]

      const result = analyzeVersionChain(middle, allItems)

      expect(result.isCurrentVersion).toBe(false)
      expect(result.isOnlyVersion).toBe(false)
      expect(result.hasPreviousVersion).toBe(true)
      expect(result.previousVersionCost).toBe(100)
      expect(result.previousVersionDate).toBe('2025-01-01')
    })
  })
})
