/**
 * TDD Unit Tests for coefficient-utils.ts
 * Story 44.9-FE: Logistics Coefficients UI
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: Tests for coefficient utility functions
 * These tests should FAIL initially until implementation is complete.
 *
 * Tests cover:
 * - normalizeCoefficient: 100 → 1.0, 125 → 1.25
 * - denormalizeCoefficient: 1.0 → 100
 * - getCoefficientStatus: base/elevated/high/peak/unavailable
 * - calculateCoefficientImpact: cost increase
 * - getTodayCoefficient: find today's value
 * - normalizeCoefficients: batch conversion
 *
 * Reference: docs/stories/epic-44/story-44.9-fe-logistics-coefficients-ui.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  normalizeCoefficient,
  denormalizeCoefficient,
  getCoefficientStatus,
  getCoefficientStatusConfig,
  calculateCoefficientImpact,
  getTodayCoefficient,
  normalizeCoefficients,
  formatCoefficient,
  getDayFromDate,
  isToday,
  formatDateLongRu,
  getTomorrowDate,
  getFirstAvailableDate,
  getCoefficientForDate,
  COEFFICIENT_STATUS_CONFIG,
  type RawCoefficient,
  type NormalizedCoefficient,
} from '../coefficient-utils'

// =============================================================================
// Test Data (from Story 44.9 specification)
// =============================================================================

const rawCoefficientsFixture: RawCoefficient[] = [
  { date: '2026-01-20', coefficient: 100 },
  { date: '2026-01-21', coefficient: 125 },
  { date: '2026-01-22', coefficient: 150 },
  { date: '2026-01-23', coefficient: 175 },
  { date: '2026-01-24', coefficient: 200 },
  { date: '2026-01-25', coefficient: 225 },
  { date: '2026-01-26', coefficient: 100 },
  { date: '2026-01-27', coefficient: 0 }, // Unavailable
]

// =============================================================================
// normalizeCoefficient Tests
// =============================================================================

describe('normalizeCoefficient', () => {
  describe('standard conversions from Story 44.9', () => {
    it('normalizes 100 to 1.0', () => {
      expect(normalizeCoefficient(100)).toBe(1.0)
    })

    it('normalizes 125 to 1.25', () => {
      expect(normalizeCoefficient(125)).toBe(1.25)
    })

    it('normalizes 150 to 1.5', () => {
      expect(normalizeCoefficient(150)).toBe(1.5)
    })

    it('normalizes 175 to 1.75', () => {
      expect(normalizeCoefficient(175)).toBe(1.75)
    })

    it('normalizes 200 to 2.0', () => {
      expect(normalizeCoefficient(200)).toBe(2.0)
    })

    it('normalizes 250 to 2.5', () => {
      expect(normalizeCoefficient(250)).toBe(2.5)
    })
  })

  describe('edge cases', () => {
    it('normalizes 0 to 0', () => {
      expect(normalizeCoefficient(0)).toBe(0)
    })

    it('normalizes 50 to 0.5', () => {
      expect(normalizeCoefficient(50)).toBe(0.5)
    })

    it('normalizes negative values correctly', () => {
      expect(normalizeCoefficient(-100)).toBe(-1.0)
    })

    it('handles fractional API values (e.g., 133)', () => {
      expect(normalizeCoefficient(133)).toBe(1.33)
    })

    it('handles very high coefficients (e.g., 500)', () => {
      expect(normalizeCoefficient(500)).toBe(5.0)
    })
  })
})

// =============================================================================
// denormalizeCoefficient Tests
// =============================================================================

describe('denormalizeCoefficient', () => {
  describe('standard conversions', () => {
    it('denormalizes 1.0 to 100', () => {
      expect(denormalizeCoefficient(1.0)).toBe(100)
    })

    it('denormalizes 1.25 to 125', () => {
      expect(denormalizeCoefficient(1.25)).toBe(125)
    })

    it('denormalizes 1.5 to 150', () => {
      expect(denormalizeCoefficient(1.5)).toBe(150)
    })

    it('denormalizes 2.0 to 200', () => {
      expect(denormalizeCoefficient(2.0)).toBe(200)
    })
  })

  describe('rounding', () => {
    it('rounds 1.333 to 133', () => {
      expect(denormalizeCoefficient(1.333)).toBe(133)
    })

    it('rounds 1.335 to 134', () => {
      expect(denormalizeCoefficient(1.335)).toBe(134)
    })

    it('rounds 0.999 to 100', () => {
      expect(denormalizeCoefficient(0.999)).toBe(100)
    })

    it('handles 0 correctly', () => {
      expect(denormalizeCoefficient(0)).toBe(0)
    })
  })
})

// =============================================================================
// getCoefficientStatus Tests (5-level system)
// =============================================================================

describe('getCoefficientStatus', () => {
  describe('status badge rules from Story 44.9', () => {
    it('returns "unavailable" for coefficient < 0', () => {
      // coefficient = 0 is FREE (base), only negative is unavailable
      expect(getCoefficientStatus(-1)).toBe('unavailable')
      expect(getCoefficientStatus(-0.5)).toBe('unavailable')
    })

    it('returns "base" for coefficient = 0 (FREE slot)', () => {
      // coefficient = 0 means FREE acceptance, not unavailable
      expect(getCoefficientStatus(0)).toBe('base')
    })

    it('returns "base" for coefficient 1.00 (green)', () => {
      expect(getCoefficientStatus(1.0)).toBe('base')
    })

    it('returns "base" for coefficient < 1.0 but > 0', () => {
      expect(getCoefficientStatus(0.5)).toBe('base')
      expect(getCoefficientStatus(0.9)).toBe('base')
    })

    it('returns "elevated" for coefficient 1.01-1.50 (yellow)', () => {
      expect(getCoefficientStatus(1.01)).toBe('elevated')
      expect(getCoefficientStatus(1.25)).toBe('elevated')
      expect(getCoefficientStatus(1.5)).toBe('elevated')
    })

    it('returns "high" for coefficient 1.51-2.0 (orange)', () => {
      expect(getCoefficientStatus(1.51)).toBe('high')
      expect(getCoefficientStatus(1.75)).toBe('high')
      expect(getCoefficientStatus(2.0)).toBe('high')
    })

    it('returns "peak" for coefficient > 2.0 (red)', () => {
      expect(getCoefficientStatus(2.01)).toBe('peak')
      expect(getCoefficientStatus(2.5)).toBe('peak')
      expect(getCoefficientStatus(3.0)).toBe('peak')
    })
  })

  describe('boundary conditions', () => {
    it('handles exact boundary at 1.0', () => {
      expect(getCoefficientStatus(1.0)).toBe('base')
      expect(getCoefficientStatus(1.001)).toBe('elevated')
    })

    it('handles exact boundary at 1.5', () => {
      expect(getCoefficientStatus(1.5)).toBe('elevated')
      expect(getCoefficientStatus(1.501)).toBe('high')
    })

    it('handles exact boundary at 2.0', () => {
      expect(getCoefficientStatus(2.0)).toBe('high')
      expect(getCoefficientStatus(2.001)).toBe('peak')
    })
  })
})

// =============================================================================
// getCoefficientStatusConfig Tests
// =============================================================================

describe('getCoefficientStatusConfig', () => {
  it('returns correct config for base status', () => {
    const config = getCoefficientStatusConfig(1.0)
    expect(config.status).toBe('base')
    expect(config.label).toBe('Базовый')
    expect(config.color).toBe('green')
  })

  it('returns correct config for elevated status', () => {
    const config = getCoefficientStatusConfig(1.25)
    expect(config.status).toBe('elevated')
    expect(config.label).toBe('Повышенный')
    expect(config.color).toBe('yellow')
  })

  it('returns correct config for high status', () => {
    const config = getCoefficientStatusConfig(1.75)
    expect(config.status).toBe('high')
    expect(config.label).toBe('Высокий')
    expect(config.color).toBe('orange')
  })

  it('returns correct config for peak status', () => {
    const config = getCoefficientStatusConfig(2.5)
    expect(config.status).toBe('peak')
    expect(config.label).toBe('Пиковый')
    expect(config.color).toBe('red')
  })

  it('returns correct config for unavailable status (negative coefficient)', () => {
    const config = getCoefficientStatusConfig(-1)
    expect(config.status).toBe('unavailable')
    expect(config.label).toBe('Недоступно')
    expect(config.color).toBe('gray')
  })

  it('returns base config for FREE slot (coefficient=0)', () => {
    // coefficient = 0 is FREE, not unavailable
    const config = getCoefficientStatusConfig(0)
    expect(config.status).toBe('base')
    expect(config.label).toBe('Базовый')
    expect(config.color).toBe('green')
  })

  it('includes styling classes in config', () => {
    const config = getCoefficientStatusConfig(1.0)
    expect(config.bgColor).toBe('bg-green-100')
    expect(config.textColor).toBe('text-green-700')
    expect(config.borderColor).toBe('border-green-300')
  })
})

// =============================================================================
// COEFFICIENT_STATUS_CONFIG Tests
// =============================================================================

describe('COEFFICIENT_STATUS_CONFIG', () => {
  it('has all 5 status levels defined', () => {
    expect(Object.keys(COEFFICIENT_STATUS_CONFIG)).toHaveLength(5)
    expect(COEFFICIENT_STATUS_CONFIG.base).toBeDefined()
    expect(COEFFICIENT_STATUS_CONFIG.elevated).toBeDefined()
    expect(COEFFICIENT_STATUS_CONFIG.high).toBeDefined()
    expect(COEFFICIENT_STATUS_CONFIG.peak).toBeDefined()
    expect(COEFFICIENT_STATUS_CONFIG.unavailable).toBeDefined()
  })

  it('has correct min/max values for base', () => {
    expect(COEFFICIENT_STATUS_CONFIG.base.minValue).toBe(0)
    expect(COEFFICIENT_STATUS_CONFIG.base.maxValue).toBe(1.0)
  })

  it('has correct min/max values for elevated', () => {
    expect(COEFFICIENT_STATUS_CONFIG.elevated.minValue).toBe(1.01)
    expect(COEFFICIENT_STATUS_CONFIG.elevated.maxValue).toBe(1.5)
  })

  it('has correct min/max values for high', () => {
    expect(COEFFICIENT_STATUS_CONFIG.high.minValue).toBe(1.51)
    expect(COEFFICIENT_STATUS_CONFIG.high.maxValue).toBe(2.0)
  })

  it('has correct min/max values for peak', () => {
    expect(COEFFICIENT_STATUS_CONFIG.peak.minValue).toBe(2.01)
    expect(COEFFICIENT_STATUS_CONFIG.peak.maxValue).toBe(Infinity)
  })
})

// =============================================================================
// calculateCoefficientImpact Tests
// =============================================================================

describe('calculateCoefficientImpact', () => {
  describe('cost increase calculation from Story 44.9', () => {
    it('calculates zero increase for coefficient 1.0', () => {
      const impact = calculateCoefficientImpact(58, 1.0)
      expect(impact.increase).toBe(0)
      expect(impact.percentIncrease).toBe(0)
    })

    it('calculates 25% increase for coefficient 1.25', () => {
      // Base 58, coefficient 1.25 → adjusted 72.5, increase 14.5
      const impact = calculateCoefficientImpact(58, 1.25)
      expect(impact.increase).toBe(14.5)
      expect(impact.percentIncrease).toBe(25)
    })

    it('calculates 50% increase for coefficient 1.5', () => {
      // Base 100, coefficient 1.5 → adjusted 150, increase 50
      const impact = calculateCoefficientImpact(100, 1.5)
      expect(impact.increase).toBe(50)
      expect(impact.percentIncrease).toBe(50)
    })

    it('calculates 100% increase for coefficient 2.0', () => {
      const impact = calculateCoefficientImpact(100, 2.0)
      expect(impact.increase).toBe(100)
      expect(impact.percentIncrease).toBe(100)
    })
  })

  describe('edge cases', () => {
    it('returns zero for coefficient less than 1.0', () => {
      const impact = calculateCoefficientImpact(100, 0.5)
      expect(impact.increase).toBe(0)
      expect(impact.percentIncrease).toBe(0)
    })

    it('returns zero for zero base cost', () => {
      const impact = calculateCoefficientImpact(0, 1.5)
      expect(impact.increase).toBe(0)
      expect(impact.percentIncrease).toBe(0)
    })

    it('returns zero for negative base cost', () => {
      const impact = calculateCoefficientImpact(-100, 1.5)
      expect(impact.increase).toBe(0)
      expect(impact.percentIncrease).toBe(0)
    })

    it('handles very small increases', () => {
      const impact = calculateCoefficientImpact(100, 1.01)
      expect(impact.increase).toBe(1)
      expect(impact.percentIncrease).toBe(1)
    })

    it('rounds increase to 2 decimal places', () => {
      const impact = calculateCoefficientImpact(33.33, 1.25)
      // 33.33 * 1.25 = 41.6625, increase = 8.3325, rounded = 8.33
      expect(impact.increase).toBe(8.33)
    })

    it('rounds percentIncrease to 1 decimal place', () => {
      const impact = calculateCoefficientImpact(100, 1.333)
      // (1.333 - 1) * 100 = 33.3
      expect(impact.percentIncrease).toBe(33.3)
    })
  })

  describe('display formatting', () => {
    it('formats increase with currency symbol', () => {
      const impact = calculateCoefficientImpact(100, 1.25)
      expect(impact.increaseDisplay).toMatch(/\+.*25/)
    })

    it('formats percent with % symbol', () => {
      const impact = calculateCoefficientImpact(100, 1.25)
      expect(impact.percentDisplay).toBe('+25.0%')
    })

    it('shows 0 ₽ for no increase', () => {
      const impact = calculateCoefficientImpact(100, 1.0)
      expect(impact.increaseDisplay).toBe('0 ₽')
      expect(impact.percentDisplay).toBe('0%')
    })
  })
})

// =============================================================================
// getTodayCoefficient Tests
// =============================================================================

describe('getTodayCoefficient', () => {
  beforeEach(() => {
    // Mock Date to a fixed value for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-21T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns coefficient for today', () => {
    const coefficients: NormalizedCoefficient[] = [
      { date: '2026-01-20', coefficient: 1.0, status: 'base', isAvailable: true },
      { date: '2026-01-21', coefficient: 1.25, status: 'elevated', isAvailable: true },
      { date: '2026-01-22', coefficient: 1.5, status: 'elevated', isAvailable: true },
    ]

    const today = getTodayCoefficient(coefficients)
    expect(today).not.toBeNull()
    expect(today?.date).toBe('2026-01-21')
    expect(today?.coefficient).toBe(1.25)
  })

  it('returns first coefficient if today not found', () => {
    const coefficients: NormalizedCoefficient[] = [
      { date: '2026-01-25', coefficient: 1.0, status: 'base', isAvailable: true },
      { date: '2026-01-26', coefficient: 1.25, status: 'elevated', isAvailable: true },
    ]

    const result = getTodayCoefficient(coefficients)
    expect(result?.date).toBe('2026-01-25')
  })

  it('returns null for empty array', () => {
    expect(getTodayCoefficient([])).toBeNull()
  })
})

// =============================================================================
// getCoefficientForDate Tests
// =============================================================================

describe('getCoefficientForDate', () => {
  const coefficients: NormalizedCoefficient[] = [
    { date: '2026-01-20', coefficient: 1.0, status: 'base', isAvailable: true },
    { date: '2026-01-21', coefficient: 1.25, status: 'elevated', isAvailable: true },
    { date: '2026-01-22', coefficient: 1.5, status: 'elevated', isAvailable: true },
  ]

  it('returns coefficient for specific date', () => {
    const result = getCoefficientForDate(coefficients, '2026-01-21')
    expect(result?.coefficient).toBe(1.25)
  })

  it('returns null for date not in array', () => {
    const result = getCoefficientForDate(coefficients, '2026-01-25')
    expect(result).toBeNull()
  })

  it('returns null for empty array', () => {
    const result = getCoefficientForDate([], '2026-01-21')
    expect(result).toBeNull()
  })
})

// =============================================================================
// normalizeCoefficients Tests (batch conversion)
// =============================================================================

describe('normalizeCoefficients', () => {
  it('normalizes array of raw coefficients', () => {
    const raw: RawCoefficient[] = [
      { date: '2026-01-20', coefficient: 100 },
      { date: '2026-01-21', coefficient: 125 },
    ]

    const normalized = normalizeCoefficients(raw)

    expect(normalized).toHaveLength(2)
    expect(normalized[0].coefficient).toBe(1.0)
    expect(normalized[1].coefficient).toBe(1.25)
  })

  it('includes status for each coefficient', () => {
    const raw: RawCoefficient[] = [
      { date: '2026-01-20', coefficient: 100 },
      { date: '2026-01-21', coefficient: 175 },
      { date: '2026-01-22', coefficient: 225 },
    ]

    const normalized = normalizeCoefficients(raw)

    expect(normalized[0].status).toBe('base')
    expect(normalized[1].status).toBe('high')
    expect(normalized[2].status).toBe('peak')
  })

  it('preserves date from raw coefficient', () => {
    const raw: RawCoefficient[] = [{ date: '2026-01-20', coefficient: 100 }]
    const normalized = normalizeCoefficients(raw)

    expect(normalized[0].date).toBe('2026-01-20')
  })

  it('handles FREE (0) coefficients as base status', () => {
    // coefficient = 0 means FREE acceptance slot, not unavailable
    const raw: RawCoefficient[] = [{ date: '2026-01-20', coefficient: 0 }]
    const normalized = normalizeCoefficients(raw)

    expect(normalized[0].coefficient).toBe(0)
    expect(normalized[0].status).toBe('base') // FREE = base (green)
  })

  it('sets isAvailable based on coefficient value by default', () => {
    const raw: RawCoefficient[] = [
      { date: '2026-01-20', coefficient: 100 },
      { date: '2026-01-21', coefficient: 0 },
      { date: '2026-01-22', coefficient: -100 },
    ]

    const normalized = normalizeCoefficients(raw)

    expect(normalized[0].isAvailable).toBe(true)
    expect(normalized[1].isAvailable).toBe(true) // 0 is available (FREE slot)
    expect(normalized[2].isAvailable).toBe(false) // negative is not available
  })

  it('respects isAvailable flag from API when provided', () => {
    const raw: RawCoefficient[] = [
      { date: '2026-01-20', coefficient: 0, isAvailable: true }, // FREE slot
      { date: '2026-01-21', coefficient: 100, isAvailable: false }, // Blocked despite valid coef
    ]

    const normalized = normalizeCoefficients(raw)

    expect(normalized[0].isAvailable).toBe(true)
    expect(normalized[1].isAvailable).toBe(false)
  })

  it('returns empty array for empty input', () => {
    expect(normalizeCoefficients([])).toEqual([])
  })

  it('handles 14-day fixture correctly', () => {
    const normalized = normalizeCoefficients(rawCoefficientsFixture)

    expect(normalized).toHaveLength(8)
    expect(normalized[0].coefficient).toBe(1.0)
    expect(normalized[1].coefficient).toBe(1.25)
    expect(normalized[7].coefficient).toBe(0) // FREE slot
    expect(normalized[7].status).toBe('base') // 0 = FREE = base
  })
})

// =============================================================================
// formatCoefficient Tests
// =============================================================================

describe('formatCoefficient', () => {
  it('formats coefficient with 2 decimal places', () => {
    expect(formatCoefficient(1.0)).toBe('1.00')
    expect(formatCoefficient(1.25)).toBe('1.25')
    expect(formatCoefficient(1.5)).toBe('1.50')
  })

  it('handles small values', () => {
    expect(formatCoefficient(0)).toBe('0.00')
    expect(formatCoefficient(0.5)).toBe('0.50')
  })

  it('handles large values', () => {
    expect(formatCoefficient(3.5)).toBe('3.50')
    expect(formatCoefficient(10.0)).toBe('10.00')
  })
})

// =============================================================================
// getDayFromDate Tests
// =============================================================================

describe('getDayFromDate', () => {
  it('extracts day number from date string', () => {
    expect(getDayFromDate('2026-01-20')).toBe(20)
    expect(getDayFromDate('2026-01-01')).toBe(1)
    expect(getDayFromDate('2026-01-31')).toBe(31)
  })
})

// =============================================================================
// isToday Tests
// =============================================================================

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-21T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true for today', () => {
    expect(isToday('2026-01-21')).toBe(true)
  })

  it('returns false for other dates', () => {
    expect(isToday('2026-01-20')).toBe(false)
    expect(isToday('2026-01-22')).toBe(false)
  })
})

// =============================================================================
// formatDateLongRu Tests
// =============================================================================

describe('formatDateLongRu', () => {
  it('formats date in long Russian format', () => {
    const formatted = formatDateLongRu('2026-01-21')
    // Expected: "21 января 2026" (Russian locale)
    expect(formatted).toContain('21')
    expect(formatted).toContain('2026')
    // Check for Russian month name pattern
    expect(formatted).toMatch(/января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря/)
  })
})

// =============================================================================
// getTomorrowDate Tests
// =============================================================================

describe('getTomorrowDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-21T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns tomorrow date in ISO format', () => {
    expect(getTomorrowDate()).toBe('2026-01-22')
  })
})

// =============================================================================
// getFirstAvailableDate Tests
// =============================================================================

describe('getFirstAvailableDate', () => {
  it('returns first available coefficient', () => {
    const coefficients: NormalizedCoefficient[] = [
      { date: '2026-01-20', coefficient: 0, status: 'unavailable', isAvailable: false },
      { date: '2026-01-21', coefficient: 1.0, status: 'base', isAvailable: true },
      { date: '2026-01-22', coefficient: 1.25, status: 'elevated', isAvailable: true },
    ]

    const result = getFirstAvailableDate(coefficients)
    expect(result?.date).toBe('2026-01-21')
  })

  it('handles FREE slot (coefficient=0 with isAvailable=true)', () => {
    const coefficients: NormalizedCoefficient[] = [
      { date: '2026-01-20', coefficient: 0, status: 'unavailable', isAvailable: true }, // FREE slot
      { date: '2026-01-21', coefficient: 1.0, status: 'base', isAvailable: true },
    ]

    const result = getFirstAvailableDate(coefficients)
    expect(result?.date).toBe('2026-01-20') // FREE slot is available
  })

  it('returns null if no available dates', () => {
    const coefficients: NormalizedCoefficient[] = [
      { date: '2026-01-20', coefficient: 0, status: 'unavailable', isAvailable: false },
      { date: '2026-01-21', coefficient: 0, status: 'unavailable', isAvailable: false },
    ]

    expect(getFirstAvailableDate(coefficients)).toBeNull()
  })

  it('returns null for empty array', () => {
    expect(getFirstAvailableDate([])).toBeNull()
  })
})

// =============================================================================
// Integration: Full Workflow Tests
// =============================================================================

describe('integration: coefficient workflow', () => {
  it('processes full API response correctly', () => {
    // Simulate API response
    const apiResponse: RawCoefficient[] = [
      { date: '2026-01-20', coefficient: 100 },
      { date: '2026-01-21', coefficient: 125 },
      { date: '2026-01-22', coefficient: 0 }, // FREE slot
      { date: '2026-01-23', coefficient: -100 }, // Unavailable
    ]

    // Normalize
    const normalized = normalizeCoefficients(apiResponse)

    // Check first coefficient
    expect(normalized[0].coefficient).toBe(1.0)
    expect(normalized[0].status).toBe('base')
    expect(getCoefficientStatusConfig(normalized[0].coefficient).label).toBe('Базовый')

    // Check elevated coefficient
    expect(normalized[1].coefficient).toBe(1.25)
    expect(normalized[1].status).toBe('elevated')

    // Check FREE slot (coefficient = 0)
    expect(normalized[2].coefficient).toBe(0)
    expect(normalized[2].status).toBe('base') // FREE = base

    // Check unavailable (coefficient < 0)
    expect(normalized[3].coefficient).toBe(-1)
    expect(normalized[3].status).toBe('unavailable')
  })

  it('calculates cost impact for logistics scenario from Story 44.9', () => {
    // Base logistics: 58 RUB (for 3L volume)
    // Coefficient: 1.25 (warehouse "busy")
    // Final: 58 × 1.25 = 72.50 RUB

    const baseCost = 58
    const coefficient = 1.25

    const impact = calculateCoefficientImpact(baseCost, coefficient)

    expect(impact.increase).toBe(14.5)
    expect(impact.percentIncrease).toBe(25)
    expect(impact.percentDisplay).toBe('+25.0%')
  })
})
