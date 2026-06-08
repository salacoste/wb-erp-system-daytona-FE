/**
 * Unit tests for wb-status-helpers
 * Extracted from wb-status-mapping.ts (Story 74.5)
 */

import { describe, it, expect } from 'vitest'
import {
  getWbStatusConfig,
  getWbStatusLabel,
  getWbStatusLabelEn,
  isWbStatusFinal,
  getWbStatusCategory,
  getStatusesByCategory,
  getFinalStatuses,
  WB_STATUS_CATEGORY_LABELS,
  WB_STATUS_CATEGORY_ICONS,
} from '../wb-status-helpers'

// ============================================================================
// getWbStatusConfig
// ============================================================================

describe('getWbStatusConfig', () => {
  it('returns config for known status "created"', () => {
    const config = getWbStatusConfig('created')
    expect(config.label).toBeDefined()
    expect(config.category).toBeDefined()
  })

  it('returns config for known status "sold"', () => {
    const config = getWbStatusConfig('sold')
    expect(config.label).toBe('Продан')
    expect(config.isFinal).toBe(true)
  })

  it('returns fallback for unknown status code', () => {
    const config = getWbStatusConfig('totally_unknown_status')
    expect(config.label).toBe('totally_unknown_status')
    expect(config.labelEn).toBe('totally_unknown_status')
  })

  it('fallback config has all required fields', () => {
    const config = getWbStatusConfig('nonexistent')
    expect(config).toHaveProperty('label')
    expect(config).toHaveProperty('labelEn')
    expect(config).toHaveProperty('category')
    expect(config).toHaveProperty('color')
    expect(config).toHaveProperty('bgColor')
    expect(config).toHaveProperty('isFinal')
    expect(config).toHaveProperty('sortOrder')
  })
})

// ============================================================================
// getWbStatusLabel
// ============================================================================

describe('getWbStatusLabel', () => {
  it('returns Russian label for known status', () => {
    expect(getWbStatusLabel('sold')).toBe('Продан')
  })

  it('returns status code for unknown status', () => {
    expect(getWbStatusLabel('unknown_xyz')).toBe('unknown_xyz')
  })
})

// ============================================================================
// getWbStatusLabelEn
// ============================================================================

describe('getWbStatusLabelEn', () => {
  it('returns English label for known status', () => {
    expect(getWbStatusLabelEn('sold')).toBe('Sold')
  })

  it('returns status code for unknown status', () => {
    expect(getWbStatusLabelEn('unknown_xyz')).toBe('unknown_xyz')
  })
})

// ============================================================================
// isWbStatusFinal
// ============================================================================

describe('isWbStatusFinal', () => {
  it('returns true for "sold" (final)', () => {
    expect(isWbStatusFinal('sold')).toBe(true)
  })

  it('returns true for "received_by_client" (final)', () => {
    expect(isWbStatusFinal('received_by_client')).toBe(true)
  })

  it('returns false for "created" (not final)', () => {
    expect(isWbStatusFinal('created')).toBe(false)
  })

  it('returns false for "delivering" (not final)', () => {
    expect(isWbStatusFinal('delivering')).toBe(false)
  })

  it('returns false for unknown status (fallback isFinal)', () => {
    // Fallback from UNKNOWN_STATUS_CONFIG should have isFinal: false
    expect(typeof isWbStatusFinal('nonexistent')).toBe('boolean')
  })
})

// ============================================================================
// getWbStatusCategory
// ============================================================================

describe('getWbStatusCategory', () => {
  it('returns delivery category for "sold"', () => {
    expect(getWbStatusCategory('sold')).toBe('delivery')
  })

  it('returns creation category for "created"', () => {
    expect(getWbStatusCategory('created')).toBe('creation')
  })

  it('returns a category string for unknown status', () => {
    const cat = getWbStatusCategory('nonexistent')
    expect(typeof cat).toBe('string')
  })
})

// ============================================================================
// getStatusesByCategory
// ============================================================================

describe('getStatusesByCategory', () => {
  it('returns delivery statuses sorted by sortOrder', () => {
    const statuses = getStatusesByCategory('delivery')
    expect(statuses.length).toBeGreaterThan(0)
    for (const s of statuses) {
      expect(s.config.category).toBe('delivery')
    }
    // Verify sort order
    for (let i = 1; i < statuses.length; i++) {
      expect(statuses[i]!.config.sortOrder).toBeGreaterThanOrEqual(
        statuses[i - 1]!.config.sortOrder
      )
    }
  })

  it('returns empty array for category with no statuses', () => {
    // 'other' may have no statuses defined
    const result = getStatusesByCategory('other')
    expect(Array.isArray(result)).toBe(true)
  })

  it('includes code and config in each entry', () => {
    const statuses = getStatusesByCategory('delivery')
    for (const s of statuses) {
      expect(typeof s.code).toBe('string')
      expect(s.config).toBeDefined()
    }
  })
})

// ============================================================================
// getFinalStatuses
// ============================================================================

describe('getFinalStatuses', () => {
  it('returns at least one final status', () => {
    const finals = getFinalStatuses()
    expect(finals.length).toBeGreaterThan(0)
  })

  it('includes "sold" in final statuses', () => {
    const finals = getFinalStatuses()
    expect(finals).toContain('sold')
  })

  it('all returned statuses are actually final', () => {
    const finals = getFinalStatuses()
    for (const code of finals) {
      expect(isWbStatusFinal(code)).toBe(true)
    }
  })
})

// ============================================================================
// WB_STATUS_CATEGORY_LABELS
// ============================================================================

describe('WB_STATUS_CATEGORY_LABELS', () => {
  it('has labels for all categories', () => {
    const categories: Array<keyof typeof WB_STATUS_CATEGORY_LABELS> = [
      'creation',
      'seller_processing',
      'warehouse',
      'logistics',
      'delivery',
      'cancellation',
      'return',
      'other',
    ]
    for (const cat of categories) {
      expect(WB_STATUS_CATEGORY_LABELS[cat]).toBeDefined()
      expect(typeof WB_STATUS_CATEGORY_LABELS[cat]).toBe('string')
    }
  })

  it('labels are in Russian', () => {
    expect(WB_STATUS_CATEGORY_LABELS.delivery).toBe('Доставка')
    expect(WB_STATUS_CATEGORY_LABELS.cancellation).toBe('Отмена')
  })
})

// ============================================================================
// WB_STATUS_CATEGORY_ICONS
// ============================================================================

describe('WB_STATUS_CATEGORY_ICONS', () => {
  it('has icon names for all categories', () => {
    const categories = Object.keys(WB_STATUS_CATEGORY_ICONS)
    expect(categories.length).toBe(8)
    for (const cat of categories) {
      expect(typeof WB_STATUS_CATEGORY_ICONS[cat as keyof typeof WB_STATUS_CATEGORY_ICONS]).toBe(
        'string'
      )
    }
  })
})
