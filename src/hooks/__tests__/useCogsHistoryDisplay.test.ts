/**
 * Unit tests for useCogsHistoryDisplay pure functions
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
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<CogsHistoryItem> = {}): CogsHistoryItem {
  return {
    cogs_id: 'cogs-1',
    nm_id: 'nm-1',
    unit_cost_rub: 100,
    currency: 'RUB',
    valid_from: '2025-01-15',
    valid_to: null,
    source: 'manual',
    notes: null,
    created_by: 'user-1',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    is_active: true,
    affected_weeks: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// formatDateRu
// ---------------------------------------------------------------------------
describe('formatDateRu', () => {
  it('formats ISO date to dd.mm.yyyy', () => {
    const result = formatDateRu('2025-01-15')
    expect(result).toBe('15.01.2025')
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
})

// ---------------------------------------------------------------------------
// formatCurrencyRu
// ---------------------------------------------------------------------------
describe('formatCurrencyRu', () => {
  it('formats number with RUB symbol', () => {
    const result = formatCurrencyRu(1250.5)
    // ru-RU currency uses non-breaking spaces (NBSP)
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

  it('returns raw source for unknown', () => {
    expect(getSourceLabel('api')).toBe('api')
  })
})

// ---------------------------------------------------------------------------
// getSourceIcon
// ---------------------------------------------------------------------------
describe('getSourceIcon', () => {
  it('returns icon for manual', () => {
    expect(getSourceIcon('manual')).toBe('✏️')
  })

  it('returns icon for import', () => {
    expect(getSourceIcon('import')).toBe('📥')
  })

  it('returns icon for system', () => {
    expect(getSourceIcon('system')).toBe('⚙️')
  })

  it('returns default icon for unknown', () => {
    expect(getSourceIcon('unknown')).toBe('📋')
  })
})

// ---------------------------------------------------------------------------
// analyzeVersionChain
// ---------------------------------------------------------------------------
describe('analyzeVersionChain', () => {
  it('identifies current version (newest)', () => {
    const item1 = makeItem({ cogs_id: 'cogs-1', valid_from: '2025-01-10', is_active: true })
    const item2 = makeItem({ cogs_id: 'cogs-2', valid_from: '2025-01-20', is_active: true })
    const result = analyzeVersionChain(item2, [item1, item2])
    expect(result.isCurrentVersion).toBe(true)
    expect(result.hasPreviousVersion).toBe(true)
    expect(result.previousVersionCost).toBe(100)
    expect(result.previousVersionDate).toBe('2025-01-10')
  })

  it('identifies non-current version', () => {
    const item1 = makeItem({ cogs_id: 'cogs-1', valid_from: '2025-01-10', is_active: true })
    const item2 = makeItem({ cogs_id: 'cogs-2', valid_from: '2025-01-20', is_active: true })
    const result = analyzeVersionChain(item1, [item1, item2])
    expect(result.isCurrentVersion).toBe(false)
    expect(result.hasPreviousVersion).toBe(false)
  })

  it('identifies only version', () => {
    const item = makeItem({ cogs_id: 'cogs-1', valid_from: '2025-01-10', is_active: true })
    const result = analyzeVersionChain(item, [item])
    expect(result.isCurrentVersion).toBe(true)
    expect(result.isOnlyVersion).toBe(true)
    expect(result.hasPreviousVersion).toBe(false)
  })

  it('ignores inactive items', () => {
    const active = makeItem({ cogs_id: 'cogs-1', valid_from: '2025-01-10', is_active: true })
    const inactive = makeItem({
      cogs_id: 'cogs-2',
      valid_from: '2025-01-20',
      is_active: false,
    })
    const result = analyzeVersionChain(active, [active, inactive])
    expect(result.isOnlyVersion).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// formatWeeksCount
// ---------------------------------------------------------------------------
describe('formatWeeksCount', () => {
  it('formats 1 week (singular)', () => {
    expect(formatWeeksCount(1)).toBe('1 неделя')
  })

  it('formats 2 weeks (2-4)', () => {
    expect(formatWeeksCount(2)).toBe('2 недели')
  })

  it('formats 3 weeks (2-4)', () => {
    expect(formatWeeksCount(3)).toBe('3 недели')
  })

  it('formats 4 weeks (2-4)', () => {
    expect(formatWeeksCount(4)).toBe('4 недели')
  })

  it('formats 5 weeks (5-20)', () => {
    expect(formatWeeksCount(5)).toBe('5 недель')
  })

  it('formats 11-19 with plural genitive', () => {
    expect(formatWeeksCount(11)).toBe('11 недель')
    expect(formatWeeksCount(15)).toBe('15 недель')
    expect(formatWeeksCount(19)).toBe('19 недель')
  })

  it('formats 21 with singular (ends in 1 but not 11)', () => {
    expect(formatWeeksCount(21)).toBe('21 неделя')
  })

  it('formats 22 with 2-4 form', () => {
    expect(formatWeeksCount(22)).toBe('22 недели')
  })

  it('formats 25 with plural genitive', () => {
    expect(formatWeeksCount(25)).toBe('25 недель')
  })

  it('formats 0', () => {
    expect(formatWeeksCount(0)).toBe('0 недель')
  })
})
