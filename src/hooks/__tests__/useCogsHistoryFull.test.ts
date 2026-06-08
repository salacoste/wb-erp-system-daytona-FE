/**
 * Tests for useCogsHistoryFull hook + display helpers
 * Pure-function coverage: formatDateRu, formatCurrencyRu, getSourceLabel,
 * getSourceIcon, analyzeVersionChain, formatWeeksCount
 *
 * The useCogsHistoryFull hook itself is a thin TanStack Query wrapper —
 * its re-exported pure display helpers contain all the testable logic.
 */

import { describe, it, expect } from 'vitest'
import {
  formatDateRu,
  formatCurrencyRu,
  getSourceLabel,
  getSourceIcon,
  analyzeVersionChain,
  formatWeeksCount,
} from '../useCogsHistoryDisplay'
import type { CogsHistoryItem } from '@/types/cogs'

// ---------------------------------------------------------------------------
// formatDateRu
// ---------------------------------------------------------------------------

describe('formatDateRu', () => {
  it('formats a valid ISO date to dd.mm.yyyy', () => {
    expect(formatDateRu('2025-01-15')).toBe('15.01.2025')
  })

  it('returns dash for null', () => {
    expect(formatDateRu(null)).toBe('—')
  })

  it('returns dash for undefined', () => {
    expect(formatDateRu(undefined)).toBe('—')
  })

  it('returns dash for empty string', () => {
    expect(formatDateRu('')).toBe('—')
  })

  it('returns dash for invalid date string', () => {
    expect(formatDateRu('not-a-date')).toBe('—')
  })

  it('pads single-digit day and month', () => {
    expect(formatDateRu('2025-03-05')).toBe('05.03.2025')
  })
})

// ---------------------------------------------------------------------------
// formatCurrencyRu
// ---------------------------------------------------------------------------

describe('formatCurrencyRu', () => {
  it('formats a positive number with RUB symbol', () => {
    const result = formatCurrencyRu(1250.5)
    expect(result).toContain('1')
    expect(result).toContain('250,50')
    expect(result).toContain('₽')
  })

  it('returns dash for null', () => {
    expect(formatCurrencyRu(null)).toBe('—')
  })

  it('returns dash for undefined', () => {
    expect(formatCurrencyRu(undefined)).toBe('—')
  })

  it('returns dash for NaN', () => {
    expect(formatCurrencyRu(NaN)).toBe('—')
  })

  it('returns dash for Infinity', () => {
    expect(formatCurrencyRu(Infinity)).toBe('—')
  })

  it('formats zero', () => {
    const result = formatCurrencyRu(0)
    expect(result).toContain('0,00')
    expect(result).toContain('₽')
  })

  it('formats a large number with thousands separator', () => {
    const result = formatCurrencyRu(1234567.89)
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain('567,89')
  })
})

// ---------------------------------------------------------------------------
// getSourceLabel
// ---------------------------------------------------------------------------

describe('getSourceLabel', () => {
  it('returns Russian label for manual', () => {
    expect(getSourceLabel('manual')).toBe('Ручной ввод')
  })

  it('returns Russian label for import', () => {
    expect(getSourceLabel('import')).toBe('Импорт')
  })

  it('returns Russian label for system', () => {
    expect(getSourceLabel('system')).toBe('Система')
  })

  it('returns the source itself for unknown values', () => {
    expect(getSourceLabel('unknown')).toBe('unknown')
  })

  it('returns empty string for empty string input', () => {
    expect(getSourceLabel('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// getSourceIcon
// ---------------------------------------------------------------------------

describe('getSourceIcon', () => {
  it('returns pencil icon for manual', () => {
    expect(getSourceIcon('manual')).toBe('✏️')
  })

  it('returns import icon for import', () => {
    expect(getSourceIcon('import')).toBe('📥')
  })

  it('returns gear icon for system', () => {
    expect(getSourceIcon('system')).toBe('⚙️')
  })

  it('returns clipboard fallback for unknown', () => {
    expect(getSourceIcon('other')).toBe('📋')
  })
})

// ---------------------------------------------------------------------------
// analyzeVersionChain
// ---------------------------------------------------------------------------

describe('analyzeVersionChain', () => {
  function makeItem(overrides: Partial<CogsHistoryItem> = {}): CogsHistoryItem {
    return {
      cogs_id: 'cogs-1',
      nm_id: '123',
      unit_cost_rub: 500,
      currency: 'RUB',
      valid_from: '2025-W01',
      valid_to: null,
      source: 'manual',
      notes: null,
      created_by: 'user',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      is_active: true,
      affected_weeks: [],
      ...overrides,
    }
  }

  it('identifies the only active version as current and only version', () => {
    const item = makeItem({ cogs_id: 'cogs-1' })
    const all = [item]
    const result = analyzeVersionChain(item, all)
    expect(result.isCurrentVersion).toBe(true)
    expect(result.isOnlyVersion).toBe(true)
    expect(result.hasPreviousVersion).toBe(false)
  })

  it('identifies the newest version as current', () => {
    const newest = makeItem({ cogs_id: 'cogs-2', valid_from: '2025-W10' })
    const oldest = makeItem({ cogs_id: 'cogs-1', valid_from: '2025-W05' })
    const result = analyzeVersionChain(newest, [newest, oldest])
    expect(result.isCurrentVersion).toBe(true)
    expect(result.isOnlyVersion).toBe(false)
  })

  it('identifies older version as not current', () => {
    const newest = makeItem({ cogs_id: 'cogs-2', valid_from: '2025-W10' })
    const oldest = makeItem({ cogs_id: 'cogs-1', valid_from: '2025-W05' })
    const result = analyzeVersionChain(oldest, [newest, oldest])
    expect(result.isCurrentVersion).toBe(false)
  })

  it('provides previous version cost and date', () => {
    const newest = makeItem({ cogs_id: 'cogs-2', valid_from: '2025-W10', unit_cost_rub: 600 })
    const oldest = makeItem({ cogs_id: 'cogs-1', valid_from: '2025-W05', unit_cost_rub: 500 })
    const result = analyzeVersionChain(newest, [newest, oldest])
    expect(result.hasPreviousVersion).toBe(true)
    expect(result.previousVersionCost).toBe(500)
    expect(result.previousVersionDate).toBe('2025-W05')
  })

  it('ignores inactive items', () => {
    const active = makeItem({ cogs_id: 'cogs-1', valid_from: '2025-W10' })
    const inactive = makeItem({ cogs_id: 'cogs-0', valid_from: '2025-W15', is_active: false })
    const result = analyzeVersionChain(active, [active, inactive])
    expect(result.isOnlyVersion).toBe(true)
  })

  it('handles empty allItems array', () => {
    const item = makeItem({ cogs_id: 'cogs-1' })
    const result = analyzeVersionChain(item, [])
    expect(result.isCurrentVersion).toBe(false)
    expect(result.isOnlyVersion).toBe(false)
    expect(result.hasPreviousVersion).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// formatWeeksCount
// ---------------------------------------------------------------------------

describe('formatWeeksCount', () => {
  it('uses singular form for 1 week', () => {
    expect(formatWeeksCount(1)).toBe('1 неделя')
  })

  it('uses plural-2 form for 2-4', () => {
    expect(formatWeeksCount(2)).toBe('2 недели')
    expect(formatWeeksCount(3)).toBe('3 недели')
    expect(formatWeeksCount(4)).toBe('4 недели')
  })

  it('uses plural-genitive form for 5-20', () => {
    expect(formatWeeksCount(5)).toBe('5 недель')
    expect(formatWeeksCount(10)).toBe('10 недель')
    expect(formatWeeksCount(20)).toBe('20 недель')
  })

  it('uses singular form for 21', () => {
    expect(formatWeeksCount(21)).toBe('21 неделя')
  })

  it('uses plural-2 form for 22-24', () => {
    expect(formatWeeksCount(22)).toBe('22 недели')
    expect(formatWeeksCount(23)).toBe('23 недели')
    expect(formatWeeksCount(24)).toBe('24 недели')
  })

  it('uses plural-genitive for 25-30', () => {
    expect(formatWeeksCount(25)).toBe('25 недель')
    expect(formatWeeksCount(30)).toBe('30 недель')
  })

  it('handles 11-19 exception (all plural-genitive)', () => {
    expect(formatWeeksCount(11)).toBe('11 недель')
    expect(formatWeeksCount(12)).toBe('12 недель')
    expect(formatWeeksCount(15)).toBe('15 недель')
    expect(formatWeeksCount(19)).toBe('19 недель')
  })

  it('handles 0', () => {
    expect(formatWeeksCount(0)).toBe('0 недель')
  })
})
