/**
 * Unit Tests for ROI & Profit Metrics Utilities
 * Covers: getROIColor, getROIRating, formatProfitPerUnit, formatROI,
 *         calculateProfitPerUnit, calculateROI
 */

import { describe, it, expect } from 'vitest'
import {
  getROIColor,
  getROIRating,
  formatProfitPerUnit,
  formatROI,
  calculateProfitPerUnit,
  calculateROI,
} from '../roi-profit-utils'

// =============================================================================
// getROIColor
// =============================================================================

describe('getROIColor', () => {
  it('returns gray for null', () => {
    expect(getROIColor(null)).toBe('text-gray-400')
  })

  it('returns gray for undefined', () => {
    expect(getROIColor(undefined)).toBe('text-gray-400')
  })

  it('returns green-600 for ROI >= 100', () => {
    expect(getROIColor(100)).toBe('text-green-600')
    expect(getROIColor(250)).toBe('text-green-600')
  })

  it('returns green-500 for ROI 50-99', () => {
    expect(getROIColor(50)).toBe('text-green-500')
    expect(getROIColor(99)).toBe('text-green-500')
  })

  it('returns yellow-600 for ROI 20-49', () => {
    expect(getROIColor(20)).toBe('text-yellow-600')
    expect(getROIColor(49)).toBe('text-yellow-600')
  })

  it('returns orange-500 for ROI 0-19', () => {
    expect(getROIColor(0)).toBe('text-orange-500')
    expect(getROIColor(19)).toBe('text-orange-500')
  })

  it('returns red-600 for negative ROI', () => {
    expect(getROIColor(-1)).toBe('text-red-600')
    expect(getROIColor(-50)).toBe('text-red-600')
  })
})

// =============================================================================
// getROIRating
// =============================================================================

describe('getROIRating', () => {
  it('returns em-dash for null', () => {
    expect(getROIRating(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(getROIRating(undefined)).toBe('—')
  })

  it('returns "Отлично" for ROI >= 100', () => {
    expect(getROIRating(100)).toBe('Отлично')
  })

  it('returns "Хорошо" for ROI 50-99', () => {
    expect(getROIRating(50)).toBe('Хорошо')
  })

  it('returns "Средне" for ROI 20-49', () => {
    expect(getROIRating(20)).toBe('Средне')
  })

  it('returns "Низко" for ROI 0-19', () => {
    expect(getROIRating(0)).toBe('Низко')
  })

  it('returns "Убыток" for negative ROI', () => {
    expect(getROIRating(-1)).toBe('Убыток')
  })
})

// =============================================================================
// formatProfitPerUnit
// =============================================================================

describe('formatProfitPerUnit', () => {
  it('returns em-dash for null', () => {
    expect(formatProfitPerUnit(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatProfitPerUnit(undefined)).toBe('—')
  })

  it('formats positive value with currency and per-unit suffix', () => {
    const result = formatProfitPerUnit(125.5)
    expect(result).toContain('₽')
    expect(result).toContain('/ед.')
  })

  it('formats zero value', () => {
    const result = formatProfitPerUnit(0)
    expect(result).toContain('₽')
    expect(result).toContain('/ед.')
  })

  it('formats negative value', () => {
    const result = formatProfitPerUnit(-50)
    expect(result).toContain('₽')
    expect(result).toContain('/ед.')
  })
})

// =============================================================================
// formatROI
// =============================================================================

describe('formatROI', () => {
  it('returns em-dash for null', () => {
    expect(formatROI(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatROI(undefined)).toBe('—')
  })

  it('formats ROI as Russian-locale percentage with NBSP', () => {
    const result = formatROI(25)
    // formatPercentage(25, 1) => "25,0 %" (Russian locale)
    expect(result).toMatch(/25/)
    expect(result).toContain('%')
  })

  it('formats zero ROI', () => {
    const result = formatROI(0)
    expect(result).toMatch(/0/)
    expect(result).toContain('%')
  })
})

// =============================================================================
// calculateProfitPerUnit
// =============================================================================

describe('calculateProfitPerUnit', () => {
  it('returns null for null profit', () => {
    expect(calculateProfitPerUnit(null, 10)).toBeNull()
  })

  it('returns null for undefined profit', () => {
    expect(calculateProfitPerUnit(undefined, 10)).toBeNull()
  })

  it('returns null for null quantity', () => {
    expect(calculateProfitPerUnit(100, null)).toBeNull()
  })

  it('returns null for zero quantity', () => {
    expect(calculateProfitPerUnit(100, 0)).toBeNull()
  })

  it('returns null for undefined quantity', () => {
    expect(calculateProfitPerUnit(100, undefined)).toBeNull()
  })

  it('calculates profit per unit correctly', () => {
    expect(calculateProfitPerUnit(100, 5)).toBe(20)
  })

  it('handles fractional results', () => {
    expect(calculateProfitPerUnit(100, 3)).toBeCloseTo(33.333, 2)
  })

  it('handles negative profit', () => {
    expect(calculateProfitPerUnit(-50, 10)).toBe(-5)
  })
})

// =============================================================================
// calculateROI
// =============================================================================

describe('calculateROI', () => {
  it('returns null for null profit', () => {
    expect(calculateROI(null, 100)).toBeNull()
  })

  it('returns null for undefined profit', () => {
    expect(calculateROI(undefined, 100)).toBeNull()
  })

  it('returns null for null COGS', () => {
    expect(calculateROI(50, null)).toBeNull()
  })

  it('returns null for zero COGS', () => {
    expect(calculateROI(50, 0)).toBeNull()
  })

  it('returns null for undefined COGS', () => {
    expect(calculateROI(50, undefined)).toBeNull()
  })

  it('calculates ROI correctly', () => {
    // profit=50, cogs=200 => (50/200)*100 = 25
    expect(calculateROI(50, 200)).toBe(25)
  })

  it('calculates ROI for 100% return', () => {
    // profit=100, cogs=100 => (100/100)*100 = 100
    expect(calculateROI(100, 100)).toBe(100)
  })

  it('calculates negative ROI for loss', () => {
    // profit=-50, cogs=100 => (-50/100)*100 = -50
    expect(calculateROI(-50, 100)).toBe(-50)
  })
})
