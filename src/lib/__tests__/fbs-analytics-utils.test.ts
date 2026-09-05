/**
 * Unit Tests for FBS Analytics Utilities
 * Covers: getSmartAggregation, getAggregationLabel, getDataSourceLabel,
 *         formatSeasonalIndex, getSeasonalityLevel, getBackfillStatusLabel, getBackfillStatusColor
 */

import { describe, it, expect } from 'vitest'
import {
  getSmartAggregation,
  getAggregationLabel,
  getDataSourceLabel,
  formatSeasonalIndex,
  getSeasonalityLevel,
  getBackfillStatusLabel,
  getBackfillStatusColor,
} from '../fbs-analytics-utils'

// =============================================================================
// getSmartAggregation
// =============================================================================

describe('getSmartAggregation', () => {
  it('returns "day" for 30 days', () => {
    expect(getSmartAggregation(30)).toBe('day')
  })

  it('returns "day" for 90 days (boundary)', () => {
    expect(getSmartAggregation(90)).toBe('day')
  })

  it('returns "week" for 91 days', () => {
    expect(getSmartAggregation(91)).toBe('week')
  })

  it('returns "week" for 120 days', () => {
    expect(getSmartAggregation(120)).toBe('week')
  })

  it('returns "week" for 180 days (boundary)', () => {
    expect(getSmartAggregation(180)).toBe('week')
  })

  it('returns "month" for 181 days', () => {
    expect(getSmartAggregation(181)).toBe('month')
  })

  it('returns "month" for 365 days', () => {
    expect(getSmartAggregation(365)).toBe('month')
  })

  it('returns "day" for 1 day', () => {
    expect(getSmartAggregation(1)).toBe('day')
  })
})

// =============================================================================
// getAggregationLabel
// =============================================================================

describe('getAggregationLabel', () => {
  it('returns "По дням" for day', () => {
    expect(getAggregationLabel('day')).toBe('По дням')
  })

  it('returns "По неделям" for week', () => {
    expect(getAggregationLabel('week')).toBe('По неделям')
  })

  it('returns "По месяцам" for month', () => {
    expect(getAggregationLabel('month')).toBe('По месяцам')
  })
})

// =============================================================================
// getDataSourceLabel
// =============================================================================

describe('getDataSourceLabel', () => {
  it('returns "Реалтайм" for orders_fbs', () => {
    expect(getDataSourceLabel('orders_fbs')).toBe('Реалтайм')
  })

  it('returns "Отчёты" for reports', () => {
    expect(getDataSourceLabel('reports')).toBe('Отчёты')
  })

  it('returns "Аналитика" for analytics', () => {
    expect(getDataSourceLabel('analytics')).toBe('Аналитика')
  })

  it('returns the source string for unknown sources', () => {
    expect(getDataSourceLabel('unknown_source')).toBe('unknown_source')
  })
})

// =============================================================================
// formatSeasonalIndex
// =============================================================================

describe('formatSeasonalIndex', () => {
  it('formats 0.72 as "72 %"', () => {
    const result = formatSeasonalIndex(0.72)
    expect(result).toContain('72')
    expect(result).toContain('%')
  })

  it('formats 0.15 as "15 %"', () => {
    const result = formatSeasonalIndex(0.15)
    expect(result).toContain('15')
    expect(result).toContain('%')
  })

  it('formats 1.0 as "100 %"', () => {
    const result = formatSeasonalIndex(1.0)
    expect(result).toContain('100')
  })

  it('formats 0 as "0 %"', () => {
    const result = formatSeasonalIndex(0)
    expect(result).toContain('0')
    expect(result).toContain('%')
  })
})

// =============================================================================
// getSeasonalityLevel
// =============================================================================

describe('getSeasonalityLevel', () => {
  it('returns "Высокая" for index >= 0.7', () => {
    expect(getSeasonalityLevel(0.7)).toBe('Высокая')
    expect(getSeasonalityLevel(0.9)).toBe('Высокая')
  })

  it('returns "Средняя" for index 0.4-0.69', () => {
    expect(getSeasonalityLevel(0.4)).toBe('Средняя')
    expect(getSeasonalityLevel(0.69)).toBe('Средняя')
  })

  it('returns "Низкая" for index < 0.4', () => {
    expect(getSeasonalityLevel(0.39)).toBe('Низкая')
    expect(getSeasonalityLevel(0)).toBe('Низкая')
  })
})

// =============================================================================
// getBackfillStatusLabel
// =============================================================================

describe('getBackfillStatusLabel', () => {
  it('returns correct labels for all statuses', () => {
    expect(getBackfillStatusLabel('pending')).toBe('Ожидает')
    expect(getBackfillStatusLabel('in_progress')).toBe('Выполняется')
    expect(getBackfillStatusLabel('completed')).toBe('Завершено')
    expect(getBackfillStatusLabel('failed')).toBe('Ошибка')
    expect(getBackfillStatusLabel('paused')).toBe('Приостановлено')
  })
})

// =============================================================================
// getBackfillStatusColor
// =============================================================================

describe('getBackfillStatusColor', () => {
  // P2 wave-5: text halves of the migrated BACKFILL_STATUS_COLORS semantic tokens.
  it('returns CSS classes for pending', () => {
    expect(getBackfillStatusColor('pending')).toContain('text-muted-foreground')
  })

  it('returns CSS classes for in_progress', () => {
    expect(getBackfillStatusColor('in_progress')).toContain('text-status-information')
  })

  it('returns CSS classes for completed', () => {
    expect(getBackfillStatusColor('completed')).toContain('text-status-success')
  })

  it('returns CSS classes for failed', () => {
    expect(getBackfillStatusColor('failed')).toContain('text-status-error')
  })

  it('returns CSS classes for paused', () => {
    expect(getBackfillStatusColor('paused')).toContain('text-status-warning')
  })
})
